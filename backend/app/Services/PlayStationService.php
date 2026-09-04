<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PlayStation trophies, through the door Sony leaves open for its own app.
 *
 * There is no public PSN API and no developer programme to join. Every tracker
 * that shows trophies — PSNProfiles, Exophase, and the rest — talks to the
 * endpoints the PlayStation mobile app uses, documented by the community rather
 * than by Sony. That has two consequences we do not get to design away:
 *
 *   1. The reader has to hand us an `npsso` token they copy out of their own
 *      browser after signing in to Sony. We cannot ask for it any other way,
 *      because there is no consent screen to send them to.
 *   2. It can stop working. Not "might be deprecated eventually" — the shape
 *      of a response can change on a Tuesday. Everything here fails soft and
 *      says so, and the whole integration sits behind a config flag so it can
 *      be turned off without a deploy.
 *
 * Nothing about a PlayStation account is required for anything else on the
 * site. When this breaks, the profile loses trophies and keeps working.
 */
class PlayStationService
{
    /*
     * ── Why the connect flow's timeouts are short ────────────────────────
     *
     * Octane kills a request at thirty seconds — `config('octane.max_execution_time', 30)`,
     * and nothing sets that key. Linking an account made three calls to Sony
     * with fifteen, fifteen and twenty second budgets: fifty seconds worst
     * case, comfortably past the point where the worker is terminated.
     *
     * A terminated worker does not produce an error page. The connection drops,
     * nginx answers 502 with no body, and the browser falls back to a generic
     * "couldn't connect" — so the reader is told nothing while the backend's
     * own, accurate message never gets written.
     *
     * Measured on 2 September: one attempt answered 422 with the real reason,
     * then seven in a row came back 502. The reader tried two browsers and two
     * fresh tokens before working out for himself that another application
     * holding his PlayStation session was the cause.
     *
     * Eight, eight and six is twenty-two seconds worst case, which leaves eight
     * for our own work. Failing inside the budget with a sentence beats dying
     * outside it without one — and if Sony needs longer than eight seconds to
     * answer an OAuth call, the request was not going to succeed anyway.
     *
     * The sync path keeps twenty: it runs in the queue, where no such ceiling
     * applies.
     */

    /**
     * Seconds Sony gets for each of the two OAuth calls a connect request makes.
     *
     * Named rather than typed in twice so the test that adds them up has
     * something to add up.
     */
    public const CONNECT_TIMEOUT = 8;

    /** And for the profile read that follows them, which is the cheaper call. */
    public const CONNECT_PROFILE_TIMEOUT = 6;

    /** The PlayStation mobile app's own client. Public knowledge, not a secret of ours. */
    private const CLIENT_ID = '09515159-7237-4370-9b40-3806e67c0891';

    private const CLIENT_SECRET = 'ucPjka5tntB2KqsP';

    private const REDIRECT_URI = 'com.scee.psxandroid.scecompcall://redirect';

    private const AUTH_BASE = 'https://ca.account.sony.com/api/authz/v3/oauth';

    private const API_BASE = 'https://m.np.playstation.com/api';

    public function enabled(): bool
    {
        return (bool) config('services.psn.enabled', false);
    }

    /**
     * npsso → authorization code → access + refresh tokens.
     *
     * @return array{access_token:string, refresh_token:?string, expires_in:int}|null
     */
    public function exchangeNpsso(string $npsso): ?array
    {
        $code = $this->authorizationCode($npsso);

        if (! $code) {
            return null;
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth(self::CLIENT_ID, self::CLIENT_SECRET)
                // Eight, not fifteen — see the note on the class.
                ->timeout(self::CONNECT_TIMEOUT)
                ->post(self::AUTH_BASE.'/token', [
                    'code' => $code,
                    'redirect_uri' => self::REDIRECT_URI,
                    'grant_type' => 'authorization_code',
                    'token_format' => 'jwt',
                ]);

            if (! $response->successful() || ! $response->json('access_token')) {
                $this->note('token exchange rejected', ['status' => $response->status()]);

                return null;
            }

            return [
                'access_token' => $response->json('access_token'),
                'refresh_token' => $response->json('refresh_token'),
                'expires_in' => (int) ($response->json('expires_in') ?? 3600),
            ];
        } catch (\Throwable $e) {
            $this->note('token exchange threw', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * A stored refresh token buys another hour without asking the reader for
     * anything. It expires after about two months, and then they have to paste
     * a fresh npsso — which the connections screen says out loud rather than
     * failing quietly on the sixty-first day.
     *
     * @return array{access_token:string, refresh_token:?string, expires_in:int}|null
     */
    public function refresh(string $refreshToken): ?array
    {
        try {
            $response = Http::asForm()
                ->withBasicAuth(self::CLIENT_ID, self::CLIENT_SECRET)
                ->timeout(15)
                ->post(self::AUTH_BASE.'/token', [
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                    'token_format' => 'jwt',
                    'scope' => 'psn:mobile.v2.core psn:clientapp',
                ]);

            if (! $response->successful() || ! $response->json('access_token')) {
                return null;
            }

            return [
                'access_token' => $response->json('access_token'),
                'refresh_token' => $response->json('refresh_token') ?? $refreshToken,
                'expires_in' => (int) ($response->json('expires_in') ?? 3600),
            ];
        } catch (\Throwable $e) {
            $this->note('refresh threw', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Who this token belongs to.
     *
     * @return array{account_id:string, online_id:string}|null
     */
    public function profile(string $accessToken): ?array
    {
        // Six seconds. This is the last of three calls in the connect request
        // and the only one whose budget the sync does not share.
        $json = $this->get($accessToken, '/userProfile/v1/internal/users/me/profiles', self::CONNECT_PROFILE_TIMEOUT);

        $accountId = $json['accountId'] ?? null;
        $onlineId = $json['onlineId'] ?? null;

        return $accountId && $onlineId
            ? ['account_id' => (string) $accountId, 'online_id' => (string) $onlineId]
            : null;
    }

    /**
     * Every game with a trophy list this account has touched.
     *
     * @return array<int, array{np_id:string, name:string, platform:string, image:?string, progress:int, earned:array}>
     */
    public function trophyTitles(string $accessToken, string $accountId, int $limit = 800): array
    {
        $json = $this->get($accessToken, "/trophy/v1/users/{$accountId}/trophyTitles?limit={$limit}");

        return collect($json['trophyTitles'] ?? [])
            ->map(fn (array $title) => [
                'np_id' => (string) ($title['npCommunicationId'] ?? ''),
                'name' => (string) ($title['trophyTitleName'] ?? ''),
                'platform' => (string) ($title['trophyTitlePlatform'] ?? ''),
                'image' => $title['trophyTitleIconUrl'] ?? null,
                'progress' => (int) ($title['progress'] ?? 0),
                'earned' => $title['earnedTrophies'] ?? [],
                'last_played' => $title['lastUpdatedDateTime'] ?? null,
            ])
            ->filter(fn (array $t) => $t['name'] !== '')
            ->values()
            ->all();
    }

    /* ── the awkward part ─────────────────────────────────────────────── */

    /**
     * Sony hands back the authorization code in a redirect it never follows.
     *
     * The npsso goes out as a cookie, the response is a 302, and the code is a
     * query parameter on the Location header. Following the redirect would
     * lose it — the target is a mobile app's URI scheme.
     */
    private function authorizationCode(string $npsso): ?string
    {
        try {
            $response = Http::withoutRedirecting()
                ->withHeaders(['Cookie' => 'npsso='.$npsso])
                // Eight, not fifteen — see the note on the class.
                ->timeout(self::CONNECT_TIMEOUT)
                ->get(self::AUTH_BASE.'/authorize', [
                    'access_type' => 'offline',
                    'client_id' => self::CLIENT_ID,
                    'redirect_uri' => self::REDIRECT_URI,
                    'response_type' => 'code',
                    'scope' => 'psn:mobile.v2.core psn:clientapp',
                ]);

            $location = $response->header('Location');

            if (! $location) {
                $this->note('no redirect from authorize — the npsso is probably expired');

                return null;
            }

            parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

            return $query['code'] ?? null;
        } catch (\Throwable $e) {
            $this->note('authorize threw', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @param  int  $timeout  seconds. Twenty by default, which is right for a
     *                        library sync in the queue; the connect flow passes
     *                        less, because it is inside a request that gets
     *                        thirty seconds in total.
     */
    private function get(string $accessToken, string $path, int $timeout = 20): array
    {
        try {
            $response = Http::withToken($accessToken)
                ->timeout($timeout)
                ->get(self::API_BASE.$path);

            if (! $response->successful()) {
                $this->note('request failed', ['path' => $path, 'status' => $response->status()]);

                return [];
            }

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            $this->note('request threw', ['path' => $path, 'error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Warning, not error. An undocumented API changing shape is expected
     * behaviour, and it should not page anybody at three in the morning.
     */
    private function note(string $message, array $context = []): void
    {
        Log::warning("PlayStationService: {$message}", $context);
    }
}
