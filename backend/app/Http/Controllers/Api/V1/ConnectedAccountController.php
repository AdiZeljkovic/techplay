<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SyncSteamLibrary;
use App\Jobs\SyncXboxLibrary;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\FunnelAnalytics;
use App\Services\OpenXblService;
use App\Services\PresenceService;
use App\Services\SteamService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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
        // A short-lived, single-purpose handle — not a bearer token. This
        // URL travels to steamcommunity.com, lands in the user's history and
        // comes back as a query string in our access logs; a full-privilege
        // Sanctum token with a seven-day life had no business in it.
        $state = Str::random(48);
        Cache::put(
            'steam:link:'.$state,
            $request->user()->id,
            now()->addMinutes(10)
        );

        $returnUrl = url('/api/v1/connected-accounts/steam/callback').'?state='.$state;

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

        // Identify the user from the single-use handle. `pull` reads and
        // removes in one step, so a replayed callback finds nothing.
        $state = (string) $request->get('state', '');
        $userId = $state !== ''
            ? Cache::pull('steam:link:'.$state)
            : null;

        $user = $userId ? User::find($userId) : null;
        if (! $user) {
            return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_error=1');
        }

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

        FunnelAnalytics::increment($account->wasRecentlyCreated ? 'steam_connected' : 'steam_reconnected');

        // Check connected_accounts achievement after linking Steam
        try {
            app(AchievementService::class)->check($user, ['connected_accounts']);
        } catch (\Throwable) {
        }

        return redirect(config('app.frontend_url').'/settings?tab=platforms&steam_connected=1');
    }

    /**
     * POST /connected-accounts/xbox/connect — link an Xbox account by gamertag.
     * Public Xbox Live data (title history, achievements) is read via OpenXBL,
     * so no OAuth round-trip is needed.
     *
     * UNVERIFIED BY DESIGN — and that is a hole, not a shortcut. Typing any
     * gamertag links it: the profile then shows someone else's handle and
     * gamerscore, their library is imported into the claimant's collection
     * (feeding collection achievements and leaderboards), and the genuine
     * owner is locked out. Closing it needs an XSTS/OAuth round-trip, or a
     * one-time nonce the user places in their Xbox bio and we read back.
     * Steam does this correctly via OpenID; Xbox never got the equivalent.
     */
    public function xboxConnect(Request $request, OpenXblService $xbl): JsonResponse
    {
        $request->validate(['gamertag' => 'required|string|min:2|max:32']);

        $profile = $xbl->findByGamertag($request->input('gamertag'));

        if (! $profile) {
            return $this->error("Couldn't find that gamertag on Xbox Live. Check the spelling — and note the profile must not be private.", 404);
        }

        // First claimant wins on (provider, provider_user_id), so without this
        // the real owner's attempt died on an integrity constraint — a 500
        // instead of an answer. It does not prove ownership; see the note on
        // this method. It only stops the collision being a crash.
        $takenByAnother = ConnectedAccount::where('provider', 'xbox')
            ->where('provider_user_id', $profile['xuid'])
            ->where('user_id', '!=', $request->user()->id)
            ->exists();

        if ($takenByAnother) {
            return $this->error('That gamertag is already linked to another TechPlay account.', 409);
        }

        $account = ConnectedAccount::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => 'xbox'],
            [
                'provider_user_id' => $profile['xuid'],
                'display_name' => $profile['gamertag'],
                'sync_status' => 'pending',
                'visibility' => 'public',
                'metadata' => ['gamerscore' => $profile['gamerscore'], 'avatar' => $profile['avatar']],
            ]
        );

        SyncXboxLibrary::dispatch($account->id)->onQueue('default');

        FunnelAnalytics::increment($account->wasRecentlyCreated ? 'xbox_connected' : 'xbox_reconnected');

        try {
            app(AchievementService::class)->check($request->user(), ['connected_accounts']);
        } catch (\Throwable) {
        }

        return $this->success([
            'gamertag' => $profile['gamertag'],
            'gamerscore' => $profile['gamerscore'],
        ], "Connected as {$profile['gamertag']} — importing your library now.");
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
            'xbox' => SyncXboxLibrary::dispatch($account->id)->onQueue('default'),
            default => null,
        };

        return $this->success(['message' => 'Sync queued']);
    }

    /**
     * PATCH /connected-accounts/{id}/visibility — show or hide what this
     * account says about you.
     *
     * The settings page has always told the reader "only you control its
     * visibility", and there was no control: connecting set `public` and
     * nothing could ever change it, so the only way to stop publishing what you
     * are playing was to disconnect the account.
     *
     * The column was already doing real work — PollSteamPresence only reads
     * accounts marked public, and the profile's Xbox chip checks the same — so
     * this is a switch for a mechanism that already existed.
     */
    public function visibility(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'visibility' => 'required|in:public,private',
        ]);

        $account = ConnectedAccount::where('user_id', $request->user()->id)->findOrFail($id);

        $account->update(['visibility' => $data['visibility']]);

        // Going private stops the poller at its next pass, but whatever it last
        // wrote is on the profile now.
        if ($data['visibility'] === 'private') {
            $presence = app(PresenceService::class);
            $active = $presence->getActive($request->user());

            if ($active && $active->source === $account->provider) {
                $presence->clear($request->user());
            }
        }

        return $this->success(
            ['visibility' => $account->visibility],
            $data['visibility'] === 'public' ? 'Visible on your profile.' : 'Hidden from your profile.'
        );
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
