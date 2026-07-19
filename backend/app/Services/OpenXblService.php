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
    private function http()
    {
        return Http::withHeaders([
            'X-Authorization' => config('services.openxbl.api_key'),
            'Accept' => 'application/json',
        ])->baseUrl(config('services.openxbl.base_url', 'https://xbl.io/api/v2'))
            ->timeout(30)
            ->retry(2, 2000);
    }

    /**
     * Resolve a gamertag to a profile. Returns ['xuid' => ..., 'gamertag' => ..., 'gamerscore' => ...] or null.
     */
    public function findByGamertag(string $gamertag): ?array
    {
        $response = $this->http()->get('/search/'.rawurlencode(trim($gamertag)));

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
