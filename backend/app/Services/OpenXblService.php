<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * OpenXBL (xbl.io) client — public Xbox Live data via the site API key.
 * Users connect by gamertag; we resolve their XUID and read their public
 * title history + achievements. Read-only, no OAuth needed.
 */
class OpenXblService
{
    /*
     * ── The gamertag lookup answers inside the request's thirty seconds ──
     *
     * Octane kills a worker at `config('octane.max_execution_time', 30)`, and
     * a killed worker writes nothing: the connection drops and nginx answers
     * 502 with no body, so our own message never reaches the reader. Thirty
     * seconds with `retry(2, 2000)` is three attempts — ninety-four seconds
     * worst case for the one call linking an Xbox account makes, which is
     * three times the budget the whole request has.
     *
     * The sync keeps the patient client. It runs in the queue, where there is
     * no ceiling and giving up early only means an incomplete library.
     */

    /** Seconds OpenXBL gets for the single lookup a connect request makes. */
    public const CONNECT_TIMEOUT = 10;

    /**
     * @param  int  $timeout  seconds per attempt
     * @param  int  $attempts  total attempts, not retries after the first
     */
    private function http(int $timeout = 30, int $attempts = 3)
    {
        return Http::withHeaders([
            'X-Authorization' => config('services.openxbl.api_key'),
            'Accept' => 'application/json',
        ])->baseUrl(config('services.openxbl.base_url', 'https://xbl.io/api/v2'))
            ->timeout($timeout)
            /*
             * `throw: false`, because every method below ends a failed call
             * with `if (! $response->successful()) return null` — and none of
             * those lines could be reached. Laravel's retry() raises a
             * RequestException once the attempts are spent, so an Xbox outage
             * came back as a 500 from our own API rather than as the null each
             * caller was written to handle.
             */
            ->retry($attempts, 2000, throw: false);
    }

    /**
     * Resolve a gamertag to a profile. Returns ['xuid' => ..., 'gamertag' => ..., 'gamerscore' => ...] or null.
     */
    public function findByGamertag(string $gamertag): ?array
    {
        // The only caller is the connect endpoint, so this one is short: ten
        // seconds, one attempt. A gamertag that does not resolve now will not
        // resolve on the third try either.
        $response = $this->http(self::CONNECT_TIMEOUT, 1)
            ->get('/search/'.rawurlencode(trim($gamertag)));

        if (! $response->successful()) {
            return null;
        }

        $person = collect($response->json('content.people', []))->first();

        if (! $person || empty($person['xuid'])) {
            return null;
        }

        return [
            'xuid' => (string) $person['xuid'],
            'gamertag' => $person['gamertag'] ?? ($person['displayName'] ?? trim($gamertag)),
            'gamerscore' => (int) ($person['gamerScore'] ?? 0),
            'avatar' => $person['displayPicRaw'] ?? null,
        ];
    }

    /**
     * Public profile summary for a XUID: gamertag, gamerscore, avatar.
     */
    public function playerSummary(string $xuid): ?array
    {
        $response = $this->http()->get('/account/'.rawurlencode($xuid));

        if (! $response->successful()) {
            return null;
        }

        $settings = collect($response->json('content.profileUsers.0.settings', []))
            ->pluck('value', 'id');

        if ($settings->isEmpty()) {
            return null;
        }

        return [
            'gamertag' => $settings->get('Gamertag'),
            'gamerscore' => (int) $settings->get('Gamerscore', 0),
            'avatar' => $settings->get('GameDisplayPicRaw'),
            /*
             * The bio, which ownership verification reads and this method
             * never returned.
             *
             * `xboxVerifyConfirm` asked for `bio` in an array built from three
             * keys, got the empty-string default every time, and told the
             * reader Xbox had not published their change yet — a sentence that
             * would have been false forever. Somebody could paste the code,
             * wait a day and try again, and it could not pass.
             *
             * Xbox sends it back with a trailing carriage return, so it is
             * trimmed here rather than at the one place that compares it.
             */
            'bio' => trim((string) $settings->get('Bio', '')),
        ];
    }

    /**
     * The player's full title history with achievement progress.
     * Each title: name, titleId, type, devices, achievement{...}, titleHistory{lastTimePlayed}.
     */
    public function playerTitles(string $xuid): array
    {
        $response = $this->http()->get('/achievements/player/'.rawurlencode($xuid));

        if (! $response->successful()) {
            return [];
        }

        return $response->json('content.titles', []) ?? [];
    }
}
