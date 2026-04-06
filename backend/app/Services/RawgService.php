<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RawgService
{
    protected $baseUrl;
    protected $apiKey;
    protected $verifySSL;

    public function __construct()
    {
        $this->apiKey = config('services.rawg.api_key');
        $this->baseUrl = config('services.rawg.base_url', 'https://api.rawg.io/api');
        $this->verifySSL = !app()->environment('local');
    }

    protected function http($timeout = 15)
    {
        $client = Http::timeout($timeout);
        if (!$this->verifySSL) {
            $client = $client->withoutVerifying();
        }
        return $client;
    }

    public function searchGames($query = '', $filters = [])
    {
        $cacheKey = 'rawg_search_' . md5($query . json_encode($filters));

        return Cache::remember($cacheKey, 3600, function () use ($query, $filters) {
            $params = array_merge([
                'key'       => $this->apiKey,
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

                \Illuminate\Support\Facades\Log::error('RAWG API Error (Search)', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG API Exception (Search): ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameDetails($slug)
    {
        $cacheKey = 'rawg_game_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}", [
                    'key' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }

                \Illuminate\Support\Facades\Log::error('RAWG API Error (Details)', [
                    'slug'   => $slug,
                    'status' => $response->status(),
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG API Exception (Details): ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameScreenshots($slug)
    {
        $cacheKey = 'rawg_screenshots_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/screenshots", [
                    'key'       => $this->apiKey,
                    'page_size' => 20,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG screenshots exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameMovies($slug)
    {
        $cacheKey = 'rawg_movies_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/movies", [
                    'key' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG movies exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameSeries($slug)
    {
        $cacheKey = 'rawg_series_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/game-series", [
                    'key'       => $this->apiKey,
                    'page_size' => 6,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG series exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameSuggested($slug)
    {
        $cacheKey = 'rawg_suggested_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/suggested", [
                    'key'       => $this->apiKey,
                    'page_size' => 6,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG suggested exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getGameAdditions($slug)
    {
        $cacheKey = 'rawg_additions_' . $slug;

        return Cache::remember($cacheKey, 86400, function () use ($slug) {
            try {
                $response = $this->http(10)->get("{$this->baseUrl}/games/{$slug}/additions", [
                    'key'       => $this->apiKey,
                    'page_size' => 6,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG additions exception: ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getUpcomingReleases($startDate, $endDate)
    {
        try {
            \Illuminate\Support\Facades\Log::info("Fetching RAWG Calendar: $startDate to $endDate");

            $response = $this->http(15)->get("{$this->baseUrl}/games", [
                'key'       => $this->apiKey,
                'dates'     => "{$startDate},{$endDate}",
                'ordering'  => '-added',
                'page_size' => 20,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            \Illuminate\Support\Facades\Log::error('RAWG API Error (Calendar)', [
                'status' => $response->status(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('RAWG API Exception (Calendar): ' . $e->getMessage());
        }

        return null;
    }
}
