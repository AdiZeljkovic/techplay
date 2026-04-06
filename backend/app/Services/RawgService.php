<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RawgService
{
    protected string $baseUrl;
    protected bool   $verifySSL;

    public function __construct(protected ApiKeyManager $keyManager)
    {
        $this->baseUrl   = config('services.rawg.base_url', 'https://api.rawg.io/api');
        $this->verifySSL = ! app()->environment('local');
    }

    // -------------------------------------------------------------------------
    // HTTP helper
    // -------------------------------------------------------------------------

    protected function http(int $timeout = 15)
    {
        $client = Http::timeout($timeout);
        if (! $this->verifySSL) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    // -------------------------------------------------------------------------
    // Grab a key or throw — jobs will retry automatically
    // -------------------------------------------------------------------------

    protected function key(): string
    {
        $key = $this->keyManager->useKey();
        if (! $key) {
            throw new \RuntimeException('All RAWG API keys exhausted — add more via: php artisan rawg:keys add <key>');
        }

        return $key->api_key;
    }

    // -------------------------------------------------------------------------
    // Listing / search (used by /games browse + GamesClientPage)
    // Not cached in DB — search results change constantly
    // -------------------------------------------------------------------------

    public function searchGames(string $query = '', array $filters = []): ?array
    {
        $params = array_merge([
            'key'       => $this->key(),
            'page_size' => 24,
        ], $filters);

        if ($query) {
            $params['search'] = $query;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games", $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('RAWG searchGames error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('RAWG searchGames exception: ' . $e->getMessage());
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Discover a single listing page — saves preview rows into DB
    // -------------------------------------------------------------------------

    public function discoverPage(int $page): ?array
    {
        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games", [
                'key'       => $this->key(),
                'page'      => $page,
                'page_size' => 24,
                'ordering'  => '-added',
            ]);

            if (! $response->successful()) {
                Log::error('RAWG discoverPage error', ['page' => $page, 'status' => $response->status()]);

                return null;
            }

            $data = $response->json();

            foreach ($data['results'] ?? [] as $game) {
                if (empty($game['slug'])) {
                    continue;
                }

                Game::updateOrCreate(['slug' => $game['slug']], [
                    'rawg_id'          => $game['id'] ?? null,
                    'name'             => $game['name'] ?? $game['slug'],
                    'released'         => $game['released'] ?? null,
                    'rating'           => $game['rating'] ?? null,
                    'metacritic'       => $game['metacritic'] ?? null,
                    'background_image' => $game['background_image'] ?? null,
                    'platforms'        => $game['platforms'] ?? null,
                    'short_screenshots'=> $game['short_screenshots'] ?? null,
                ]);
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG discoverPage exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Game details — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameDetails(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('details_crawled_at')->first();
        if ($game && $game->details_crawled_at->gt(now()->subDays(30))) {
            return $game->details_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}", [
                'key' => $this->key(),
            ]);

            if (! $response->successful()) {
                Log::error('RAWG getGameDetails error', ['slug' => $slug, 'status' => $response->status()]);

                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'rawg_id'            => $data['id'] ?? null,
                'name'               => $data['name'] ?? $slug,
                'released'           => $data['released'] ?? null,
                'rating'             => $data['rating'] ?? null,
                'metacritic'         => $data['metacritic'] ?? null,
                'background_image'   => $data['background_image'] ?? null,
                'details_data'       => $data,
                'details_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameDetails exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Screenshots — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameScreenshots(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('screenshots_crawled_at')->first();
        if ($game && $game->screenshots_crawled_at->gt(now()->subDays(30))) {
            return $game->screenshots_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/screenshots", [
                'key'       => $this->key(),
                'page_size' => 20,
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'screenshots_data'       => $data,
                'screenshots_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameScreenshots exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Movies — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameMovies(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('movies_crawled_at')->first();
        if ($game && $game->movies_crawled_at->gt(now()->subDays(30))) {
            return $game->movies_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/movies", [
                'key' => $this->key(),
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'movies_data'       => $data,
                'movies_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameMovies exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Series — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameSeries(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('series_crawled_at')->first();
        if ($game && $game->series_crawled_at->gt(now()->subDays(30))) {
            return $game->series_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/game-series", [
                'key'       => $this->key(),
                'page_size' => 6,
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'series_data'       => $data,
                'series_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameSeries exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Suggested — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameSuggested(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('suggested_crawled_at')->first();
        if ($game && $game->suggested_crawled_at->gt(now()->subDays(30))) {
            return $game->suggested_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/suggested", [
                'key'       => $this->key(),
                'page_size' => 6,
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'suggested_data'       => $data,
                'suggested_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameSuggested exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Additions / DLC — DB-first (30 day TTL)
    // -------------------------------------------------------------------------

    public function getGameAdditions(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('additions_crawled_at')->first();
        if ($game && $game->additions_crawled_at->gt(now()->subDays(30))) {
            return $game->additions_data;
        }

        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/additions", [
                'key'       => $this->key(),
                'page_size' => 6,
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            Game::updateOrCreate(['slug' => $slug], [
                'additions_data'       => $data,
                'additions_crawled_at' => now(),
            ]);

            return $data;
        } catch (\Exception $e) {
            Log::error('RAWG getGameAdditions exception: ' . $e->getMessage());

            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Upcoming releases calendar (not cached — always fresh)
    // -------------------------------------------------------------------------

    public function getUpcomingReleases(string $startDate, string $endDate): ?array
    {
        try {
            Log::info("Fetching RAWG Calendar: {$startDate} to {$endDate}");

            $response = $this->http(15)->get("{$this->baseUrl}/games", [
                'key'       => $this->key(),
                'dates'     => "{$startDate},{$endDate}",
                'ordering'  => '-added',
                'page_size' => 20,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('RAWG getUpcomingReleases error', ['status' => $response->status()]);
        } catch (\Exception $e) {
            Log::error('RAWG getUpcomingReleases exception: ' . $e->getMessage());
        }

        return null;
    }
}
