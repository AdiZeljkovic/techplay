<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SyncEpicLibrary;
use App\Jobs\SyncGogLibrary;
use App\Jobs\SyncPlayStationLibrary;
use App\Jobs\SyncSteamLibrary;
use App\Jobs\SyncXboxLibrary;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\EpicService;
use App\Services\FunnelAnalytics;
use App\Services\GogService;
use App\Services\OpenXblService;
use App\Services\PlayStationService;
use App\Services\PresenceService;
use App\Services\SteamService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
            ->get(['id', 'provider', 'display_name', 'sync_status', 'sync_error', 'last_synced_at', 'visibility', 'metadata'])
            ->map(fn (ConnectedAccount $account) => [
                'id' => $account->id,
                'provider' => $account->provider,
                'display_name' => $account->display_name,
                'sync_status' => $account->sync_status,
                'sync_error' => $account->sync_error,
                'last_synced_at' => $account->last_synced_at?->toIso8601String(),
                'visibility' => $account->visibility,
                // Whether the gamertag was ever proved, and when a PlayStation
                // link will need a fresh token — both things the screen has to
                // say out loud rather than discover by failing.
                'verified' => data_get($account->metadata, 'verified_at') !== null,
                'reconnect_after' => data_get($account->metadata, 'reconnect_after'),
            ]);

        // provider_user_id is deliberately not here. It is a Steam ID or an
        // XUID — a stable handle to somebody's account elsewhere, and the
        // screen has a display name to show instead.
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
            return redirect(config('app.frontend_url').'/settings?section=connections&steam_error=1');
        }

        // Extract Steam64 ID from claimed_id URL
        $claimedId = $request->input('openid_claimed_id', '');
        preg_match('#/(\d{17})$#', $claimedId, $m);
        $steamId = $m[1] ?? null;

        if (! $steamId) {
            return redirect(config('app.frontend_url').'/settings?section=connections&steam_error=1');
        }

        // Identify the user from the single-use handle. `pull` reads and
        // removes in one step, so a replayed callback finds nothing.
        $state = (string) $request->input('state', '');
        $userId = $state !== ''
            ? Cache::pull('steam:link:'.$state)
            : null;

        $user = $userId ? User::find($userId) : null;
        if (! $user) {
            return redirect(config('app.frontend_url').'/settings?section=connections&steam_error=1');
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

        return redirect(config('app.frontend_url').'/settings?section=connections&steam_connected=1');
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
     * POST /connected-accounts/playstation/connect
     *
     * Sony runs no developer programme and offers no consent screen, so the
     * only way in is the token the PlayStation website already put in the
     * reader's own browser. We ask for it plainly and say what it does.
     */
    public function playstationConnect(Request $request, PlayStationService $psn): JsonResponse
    {
        if (! $psn->enabled()) {
            return $this->error('PlayStation linking is switched off right now.', 503);
        }

        $data = $request->validate([
            // Sony's npsso is a 64-character token. Loose on the length so a
            // format change does not lock everybody out before we notice.
            'npsso' => 'required|string|min:32|max:256',
        ]);

        $tokens = $psn->exchangeNpsso(trim($data['npsso']));

        if (! $tokens) {
            return $this->error(
                "That token didn't work. It expires quickly — sign in to Sony, open the npsso page again and copy a fresh one.",
                422
            );
        }

        $profile = $psn->profile($tokens['access_token']);

        if (! $profile) {
            return $this->error("Signed in, but PlayStation didn't say who you are. Try again in a minute.", 502);
        }

        $takenByAnother = ConnectedAccount::where('provider', 'playstation')
            ->where('provider_user_id', $profile['account_id'])
            ->where('user_id', '!=', $request->user()->id)
            ->exists();

        if ($takenByAnother) {
            return $this->error('That PlayStation account is already linked to another TechPlay account.', 409);
        }

        $account = ConnectedAccount::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => 'playstation'],
            [
                'provider_user_id' => $profile['account_id'],
                'display_name' => $profile['online_id'],
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
                'token_expires_at' => now()->addSeconds($tokens['expires_in']),
                'sync_status' => 'pending',
                'visibility' => 'public',
                // Roughly two months, which is what Sony's refresh window has
                // been. The connections screen warns before it lands rather
                // than letting a sync fail on the day.
                'metadata' => ['reconnect_after' => now()->addDays(55)->toDateString()],
            ]
        );

        SyncPlayStationLibrary::dispatch($account->id)->onQueue('default');

        try {
            app(AchievementService::class)->check($request->user(), ['connected_accounts']);
        } catch (\Throwable) {
        }

        return $this->success(
            ['online_id' => $profile['online_id']],
            "Connected as {$profile['online_id']} — importing your trophies now."
        );
    }

    /**
     * POST /connected-accounts/epic/connect — a code Epic hands out to whoever
     * is signed in.
     *
     * Epic Account Services, the OAuth a website may use, has no entitlements
     * scope — checked against Epic's own docs. So this is the launcher's flow,
     * the way Legendary and Heroic do it: the reader opens a page Epic answers
     * with a JSON authorizationCode and pastes it here.
     */
    public function epicConnect(Request $request, EpicService $epic): JsonResponse
    {
        if (! $epic->enabled()) {
            return $this->error('Epic linking is switched off right now.', 503);
        }

        $data = $request->validate([
            'code' => 'required|string|min:10|max:256',
        ]);

        $tokens = $epic->exchangeCode(trim($data['code']));

        if (! $tokens) {
            return $this->error(
                "That code didn't work. Epic's codes are single-use and expire in minutes — open the link again and copy a fresh one.",
                422,
            );
        }

        if (! $tokens['account_id']) {
            return $this->error("Signed in, but Epic didn't say who you are. Try again in a minute.", 502);
        }

        $takenByAnother = ConnectedAccount::where('provider', 'epic')
            ->where('provider_user_id', $tokens['account_id'])
            ->where('user_id', '!=', $request->user()->id)
            ->exists();

        if ($takenByAnother) {
            return $this->error('That Epic account is already linked to another TechPlay account.', 409);
        }

        $account = ConnectedAccount::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => 'epic'],
            [
                'provider_user_id' => $tokens['account_id'],
                'display_name' => $tokens['display_name'],
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
                'token_expires_at' => now()->addSeconds($tokens['expires_in']),
                'sync_status' => 'pending',
                'visibility' => 'public',
            ]
        );

        SyncEpicLibrary::dispatch($account->id)->onQueue('default');

        try {
            app(AchievementService::class)->check($request->user(), ['connected_accounts']);
        } catch (\Throwable) {
        }

        return $this->success(
            ['display_name' => $tokens['display_name']],
            'Connected — importing your Epic library now.',
        );
    }

    /**
     * POST /connected-accounts/gog/connect — a code out of the address bar.
     *
     * GOG has no OAuth programme for third parties, so this is the flow the
     * Galaxy client uses: the reader signs in on GOG's own page, lands on a
     * blank success page, and copies the `code=` out of the URL. Exactly the
     * shape the PlayStation link already has, for exactly the same reason —
     * there is no consent screen to send them to.
     */
    public function gogConnect(Request $request, GogService $gog): JsonResponse
    {
        if (! $gog->enabled()) {
            return $this->error('GOG linking is switched off right now.', 503);
        }

        $data = $request->validate([
            // GOG's codes have been a fixed length for years; loose bounds so
            // a format change does not lock everybody out before we notice.
            'code' => 'required|string|min:10|max:256',
        ]);

        $tokens = $gog->exchangeCode(trim($data['code']));

        if (! $tokens) {
            return $this->error(
                "That code didn't work. It can only be used once and expires quickly — open the GOG sign-in link again and copy a fresh one.",
                422,
            );
        }

        $gogUserId = $tokens['user_id'];

        if (! $gogUserId) {
            return $this->error("Signed in, but GOG didn't say who you are. Try again in a minute.", 502);
        }

        $takenByAnother = ConnectedAccount::where('provider', 'gog')
            ->where('provider_user_id', $gogUserId)
            ->where('user_id', '!=', $request->user()->id)
            ->exists();

        if ($takenByAnother) {
            return $this->error('That GOG account is already linked to another TechPlay account.', 409);
        }

        $account = ConnectedAccount::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => 'gog'],
            [
                'provider_user_id' => $gogUserId,
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
                'token_expires_at' => now()->addSeconds($tokens['expires_in']),
                'sync_status' => 'pending',
                'visibility' => 'public',
            ]
        );

        SyncGogLibrary::dispatch($account->id)->onQueue('default');

        try {
            app(AchievementService::class)->check($request->user(), ['connected_accounts']);
        } catch (\Throwable) {
        }

        return $this->success(
            ['login_url' => GogService::LOGIN_URL],
            'Connected — importing your GOG library now.',
        );
    }

    /**
     * POST /connected-accounts/xbox/verify — start proving the gamertag is yours.
     *
     * Linking an Xbox account has only ever needed the gamertag typed in,
     * because OpenXBL reads public data and does not care who is asking. First
     * claimant wins, which stops the collision being a crash but proves
     * nothing. This is the same trick PSNProfiles uses: put a code somewhere
     * only the account owner can write, then go and read it back.
     */
    public function xboxVerifyStart(Request $request): JsonResponse
    {
        $account = ConnectedAccount::where('user_id', $request->user()->id)
            ->where('provider', 'xbox')
            ->firstOrFail();

        $code = 'TP-'.strtoupper(Str::random(6));

        $account->update([
            'metadata' => array_merge($account->metadata ?? [], [
                'verification_code' => $code,
                'verification_started_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this->success([
            'code' => $code,
            'instructions' => 'Put this code in your Xbox profile bio, then come back and press Verify. You can remove it afterwards.',
        ]);
    }

    /**
     * POST /connected-accounts/xbox/verify/confirm — go and read it back.
     */
    public function xboxVerifyConfirm(Request $request, OpenXblService $xbl): JsonResponse
    {
        $account = ConnectedAccount::where('user_id', $request->user()->id)
            ->where('provider', 'xbox')
            ->firstOrFail();

        $code = data_get($account->metadata, 'verification_code');

        if (! $code) {
            return $this->error('Start the verification first.', 422);
        }

        $summary = $xbl->playerSummary($account->provider_user_id);

        // Xbox itself is unreachable — a different answer from "the code is
        // not there", and one the reader can do nothing about by editing
        // their bio again.
        if ($summary === null) {
            return $this->error("Couldn't reach Xbox just now. Try again in a moment.", 503);
        }

        $bio = (string) data_get($summary, 'bio', '');

        if (! str_contains(strtoupper($bio), $code)) {
            return $this->error("Couldn't find the code in that Xbox profile yet. Xbox can take a minute to publish a bio change.", 422);
        }

        $account->update([
            'metadata' => array_merge($account->metadata ?? [], [
                'verified_at' => now()->toIso8601String(),
                'verification_code' => null,
            ]),
        ]);

        return $this->success(null, 'Verified — that gamertag is yours.');
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
            'playstation' => SyncPlayStationLibrary::dispatch($account->id)->onQueue('default'),
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
    /**
     * Ask Steam whether the assertion it just sent us is really its own.
     *
     * This has never once returned true. `$request->all()` was handing back
     * `openid_claimed_id`, `openid_sig`, `openid_signed` — PHP rewrites a dot
     * in a query-string key to an underscore, and has since forever — while
     * check_authentication requires every field echoed back under the exact
     * name Steam sent it with. The one key that kept its dot was the
     * `openid.mode` this method set itself, so Steam received a payload with
     * no recognisable OpenID fields in it and answered is_valid:false. Every
     * attempt redirected to steam_error=1, which nothing on the frontend
     * displayed, so linking Steam looked like a button that did nothing.
     *
     * `parse_str()` is no escape: it performs the same substitution. The raw
     * query string has to be split by hand.
     */
    private function verifySteamOpenId(Request $request): bool
    {
        $params = [];

        foreach (explode('&', (string) $request->server('QUERY_STRING')) as $pair) {
            if ($pair === '') {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $pair, 2), 2, '');
            $key = urldecode($key);

            // Only the assertion goes back. `state` is ours, not Steam's.
            if (str_starts_with($key, 'openid.')) {
                $params[$key] = urldecode($value);
            }
        }

        if (! isset($params['openid.sig'], $params['openid.signed'])) {
            Log::warning('Steam OpenID callback carried no signature.', ['keys' => array_keys($params)]);

            return false;
        }

        $params['openid.mode'] = 'check_authentication';

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post('https://steamcommunity.com/openid/login', $params);
        } catch (\Throwable $e) {
            Log::warning('Steam OpenID verification could not reach Steam.', ['error' => $e->getMessage()]);

            return false;
        }

        $valid = str_contains($response->body(), 'is_valid:true');

        if (! $valid) {
            // Silence here is what hid this for months: three attempts across
            // two weeks, all 302, and not one line in the log to say why.
            Log::warning('Steam OpenID assertion rejected by Steam.', [
                'status' => $response->status(),
                'body' => Str::limit($response->body(), 200),
            ]);
        }

        return $valid;
    }
}
