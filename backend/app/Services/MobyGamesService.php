<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MobyGamesService
{
    private const BASE_URL = 'https://api.mobygames.com/v1';

    // Rate limit: 0.2 req/sec (Hobbyist tier) → 5 seconds between requests
    private const RATE_LIMIT_SLEEP = 5;

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.mobygames.api_key', '');
    }

    /**
     * GET /v1/games/{id}?include=publishers,developers
     */
    public function getGame(int $mobyId): ?array
    {
        return $this->request("/games/{$mobyId}", [
            'include' => 'publishers,developers',
        ]);
    }

    /**
     * GET /v1/games/{id}/platforms/{platform_id}
     * Returns age ratings (ESRB/PEGI/USK/ACB) + system requirements + attributes
     */
    public function getPlatformData(int $mobyId, int $platformId): ?array
    {
        return $this->request("/games/{$mobyId}/platforms/{$platformId}");
    }

    /**
     * GET /v1/games/{id}/platforms/{platform_id}/screenshots
     * Returns up to 48 screenshots with captions and thumbnails
     */
    public function getScreenshots(int $mobyId, int $platformId): ?array
    {
        return $this->request("/games/{$mobyId}/platforms/{$platformId}/screenshots");
    }

    /**
     * GET /v1/games/{id}/platforms/{platform_id}/covers
     * Returns all cover images with regional variants (US/EU/JP)
     */
    public function getCovers(int $mobyId, int $platformId): ?array
    {
        return $this->request("/games/{$mobyId}/platforms/{$platformId}/covers");
    }

    /**
     * GET /v1/games?limit=100&offset=N&include=publishers,developers
     * Returns paginated list of all games
     */
    public function getGames(int $offset = 0, int $limit = 100): ?array
    {
        return $this->request('/games', [
            'limit'   => $limit,
            'offset'  => $offset,
            'include' => 'publishers,developers',
        ]);
    }

    /**
     * GET /v1/games?company={id}&include=publishers,developers&limit=100
     */
    public function getGamesByCompany(int $companyId, int $offset = 0): ?array
    {
        return $this->request('/games', [
            'company' => $companyId,
            'include' => 'publishers,developers',
            'limit'   => 100,
            'offset'  => $offset,
        ]);
    }

    /**
     * GET /v1/games?title={query}&limit=100&offset=N
     */
    public function searchGames(string $query, int $offset = 0): ?array
    {
        return $this->request('/games', [
            'title'  => $query,
            'limit'  => 100,
            'offset' => $offset,
        ]);
    }

    /**
     * Rate-limited HTTP request.
     * Sleeps RATE_LIMIT_SLEEP seconds before each call to respect 0.2 req/sec.
     */
    private function request(string $endpoint, array $params = []): ?array
    {
        sleep(self::RATE_LIMIT_SLEEP);

        $params['api_key'] = $this->apiKey;

        try {
            $response = Http::timeout(30)
                ->retry(2, 10000)
                ->get(self::BASE_URL . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('MobyGames API error', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('MobyGames API exception', [
                'endpoint' => $endpoint,
                'error'    => $e->getMessage(),
            ]);

            return null;
        }
    }

    // -----------------------------------------------------------------------
    // Static helpers for data transformation
    // -----------------------------------------------------------------------

    /**
     * Derive a URL slug from a MobyGames game URL.
     * https://www.mobygames.com/game/7/v-for-victory-utah-beach/ → "v-for-victory-utah-beach"
     */
    public static function slugFromUrl(string $mobyUrl): string
    {
        // Strip trailing slash and get last path segment
        return basename(rtrim($mobyUrl, '/'));
    }

    /**
     * Pick the "primary" platform_id for enrichment API calls.
     * Prefers Windows (id=3), then any PC platform, then the first in the list.
     *
     * @param array $platforms  Array of { platform_id, platform_name, first_release_date }
     */
    public static function primaryPlatformId(array $platforms): ?int
    {
        if (empty($platforms)) {
            return null;
        }

        // Windows = platform_id 3
        foreach ($platforms as $p) {
            if (($p['platform_id'] ?? null) === 3) {
                return 3;
            }
        }

        // Any "Windows" name variant
        foreach ($platforms as $p) {
            if (stripos($p['platform_name'] ?? '', 'windows') !== false) {
                return $p['platform_id'];
            }
        }

        // First platform in list
        return $platforms[0]['platform_id'] ?? null;
    }

    /**
     * Parse release date from MobyGames format ("1991", "1991-06", "1991-06-15") → "YYYY-MM-DD"
     */
    public static function parseReleaseDate(?string $date): ?string
    {
        if (! $date) {
            return null;
        }

        // Already full date
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        // Year-month
        if (preg_match('/^\d{4}-\d{2}$/', $date)) {
            return $date . '-01';
        }

        // Year only
        if (preg_match('/^\d{4}$/', $date)) {
            return $date . '-01-01';
        }

        return null;
    }

    /**
     * Find the earliest release date across all platforms.
     *
     * @param array $platforms  Array of { platform_id, platform_name, first_release_date }
     */
    public static function earliestReleaseDate(array $platforms): ?string
    {
        $dates = [];
        foreach ($platforms as $p) {
            $parsed = self::parseReleaseDate($p['first_release_date'] ?? null);
            if ($parsed) {
                $dates[] = $parsed;
            }
        }

        if (empty($dates)) {
            return null;
        }

        sort($dates);
        return $dates[0];
    }

    /**
     * Normalize a MobyGames platform name into our hub-compatible platform_names[].
     * Returns an array of tags (e.g. "PlayStation 4" → ["PlayStation", "PS4"]).
     */
    public static function normalizePlatformNames(array $platforms): array
    {
        $names = [];
        foreach ($platforms as $p) {
            $name = $p['platform_name'] ?? '';
            foreach (self::platformTags($name) as $tag) {
                if (! in_array($tag, $names, true)) {
                    $names[] = $tag;
                }
            }
        }
        return $names;
    }

    private static function platformTags(string $name): array
    {
        $map = [
            'Windows'          => ['PC', 'Windows'],
            'DOS'              => ['PC', 'DOS'],
            'Linux'            => ['PC', 'Linux'],
            'Macintosh'        => ['PC', 'Mac'],
            'Mac OS X'         => ['PC', 'Mac'],
            'macOS'            => ['PC', 'Mac'],
            'PlayStation 5'    => ['PlayStation', 'PS5'],
            'PlayStation 4'    => ['PlayStation', 'PS4'],
            'PlayStation 3'    => ['PlayStation', 'PS3'],
            'PlayStation 2'    => ['PlayStation', 'PS2'],
            'PlayStation'      => ['PlayStation', 'PS1'],
            'PS Vita'          => ['PlayStation', 'PS Vita'],
            'PSP'              => ['PlayStation', 'PSP'],
            'Xbox Series X'    => ['Xbox', 'Xbox Series X'],
            'Xbox One'         => ['Xbox', 'Xbox One'],
            'Xbox 360'         => ['Xbox', 'Xbox 360'],
            'Xbox'             => ['Xbox', 'Xbox'],
            'Nintendo Switch'  => ['Nintendo', 'Switch'],
            'Wii U'            => ['Nintendo', 'Wii U'],
            'Wii'              => ['Nintendo', 'Wii'],
            'Nintendo 64'      => ['Nintendo', 'N64'],
            'Super Nintendo'   => ['Nintendo', 'SNES'],
            'Nintendo DS'      => ['Nintendo', 'DS'],
            '3DS'              => ['Nintendo', '3DS'],
            'Game Boy Advance'  => ['Nintendo', 'GBA'],
            'Android'          => ['Mobile', 'Android'],
            'iPhone'           => ['Mobile', 'iOS'],
        ];

        foreach ($map as $key => $tags) {
            if (stripos($name, $key) !== false) {
                return $tags;
            }
        }

        return [$name];
    }

    /**
     * Split MobyGames genres into genre_names (Basic Genres) and tag_names (everything else).
     *
     * @param array $genres  Array of { genre_category, genre_name }
     * @return array{ genre_names: string[], tag_names: string[] }
     */
    public static function splitGenres(array $genres): array
    {
        $genreNames = [];
        $tagNames   = [];

        foreach ($genres as $g) {
            $category = $g['genre_category'] ?? '';
            $name     = $g['genre_name'] ?? '';

            if (! $name) {
                continue;
            }

            if ($category === 'Basic Genres') {
                $genreNames[] = $name;
            } else {
                $tagNames[] = $name;
            }
        }

        return ['genre_names' => $genreNames, 'tag_names' => $tagNames];
    }
}
