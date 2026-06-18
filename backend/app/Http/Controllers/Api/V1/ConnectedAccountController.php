<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Services\SteamService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\PersonalAccessToken;

class ConnectedAccountController extends Controller
{
    use ApiResponse;

    /**
     * GET /connected-accounts — list all connected accounts for the auth user.
     */
    public function index(Request $request): JsonResponse
    {
        $accounts = ConnectedAccount::where('user_id', $request->user()->id)
            ->get(['id', 'provider', 'provider_user_id', 'display_name', 'sync_status', 'last_synced_at', 'visibility']);

        return $this->success($accounts);
    }

    /**
     * POST /connected-accounts/steam/connect — initiate Steam OpenID flow.
     * Returns the Steam login URL for the frontend to redirect to.
     */
    public function steamConnectUrl(Request $request): JsonResponse
    {
        $returnUrl = url('/api/v1/connected-accounts/steam/callback')
            .'?user_token='.$request->user()->createToken('steam-connect')->plainTextToken;

        $params = http_build_query([
            'openid.ns' => 'http://specs.openid.net/auth/2.0',
            'openid.mode' => 'checkid_setup',
            'openid.return_to' => $returnUrl,
            'openid.realm' => config('app.url'),
            'openid.identity' => 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id' => 'http://specs.openid.net/auth/2.0/identifier_select',
        ]);

        return $this->success(['url' => 'https://steamcommunity.com/openid/login?'.$params]);
    }

    /**
     * GET /connected-accounts/steam/callback — Steam OpenID callback.
     * Verifies the assertion, stores the account, queues a sync.
     */
    public function steamCallback(Request $request, SteamService $steam): RedirectResponse
    {
        // Validate the OpenID response
        if (! $this->verifySteamOpenId($request)) {
            return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_error=1');
        }

        // Extract Steam64 ID from claimed_id URL
        $claimedId = $request->get('openid_claimed_id', '');
        preg_match('#/(\d{17})$#', $claimedId, $m);
        $steamId = $m[1] ?? null;

        if (! $steamId) {
            return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_error=1');
        }

        // Identify the user via the short-lived token
        $token = $request->get('user_token');
        $tokenModel = PersonalAccessToken::findToken($token);
        if (! $tokenModel) {
            return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_error=1');
        }
        $user = $tokenModel->tokenable;
        $tokenModel->delete(); // single-use

        // Get display name from Steam
        $profile = $steam->getPlayerSummary($steamId);
        $displayName = $profile['personaname'] ?? null;

        $account = ConnectedAccount::updateOrCreate(
            ['user_id' => $user->id, 'provider' => 'steam'],
            [
                'provider_user_id' => $steamId,
                'display_name' => $displayName,
                'sync_status' => 'pending',
                'visibility' => 'public',
            ]
        );

        SyncSteamLibrary::dispatch($account->id)->onQueue('default');

        return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_connected=1');
    }

    /**
     * POST /connected-accounts/{id}/sync — re-trigger a sync.
     */
    public function sync(Request $request, int $id): JsonResponse
    {
        $account = ConnectedAccount::where('user_id', $request->user()->id)->findOrFail($id);

        if ($account->sync_status === 'syncing') {
            return $this->error('Sync already in progress', 422);
        }

        $account->update(['sync_status' => 'pending']);

        match ($account->provider) {
            'steam' => SyncSteamLibrary::dispatch($account->id)->onQueue('default'),
            default => null,
        };

        return $this->success(['message' => 'Sync queued']);
    }

    /**
     * DELETE /connected-accounts/{id} — disconnect an account.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        ConnectedAccount::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return $this->success(['message' => 'Account disconnected']);
    }

    /**
     * Verify Steam OpenID 2.0 response by sending it back to Steam.
     */
    private function verifySteamOpenId(Request $request): bool
    {
        $params = $request->all();
        $params['openid.mode'] = 'check_authentication';

        $response = Http::asForm()->post('https://steamcommunity.com/openid/login', $params);

        return str_contains($response->body(), 'is_valid:true');
    }
}
