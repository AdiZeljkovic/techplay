<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RawgService
{
    protected $baseUrl = 'https://api.rawg.io/api';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = env('RAWG_API_KEY');
    }

    public function searchGames($query = '', $filters = [])
    {
        $cacheKey = 'rawg_search_' . md5($query . json_encode($filters));

        return Cache::remember($cacheKey, 3600, function () use ($query, $filters) {
            $params = array_merge([
                'key' => $this->apiKey,
                'search' => $query,
                'page_size' => 12,
            ], $filters);

            try {
                $response = Http::withoutVerifying()->timeout(10)->get("{$this->baseUrl}/games", $params);

                if ($response->successful()) {
                    return $response->json();
                }

                \Illuminate\Support\Facades\Log::error('RAWG API Error (Search)', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'url' => "{$this->baseUrl}/games",
                    'params' => $params
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
                $response = Http::withoutVerifying()->timeout(10)->get("{$this->baseUrl}/games/{$slug}", [
                    'key' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    return $response->json();
                }

                \Illuminate\Support\Facades\Log::error('RAWG API Error (Details)', [
                    'slug' => $slug,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('RAWG API Exception (Details): ' . $e->getMessage());
            }

            return null;
        });
    }

    public function getUpcomingReleases($startDate, $endDate)
    {
        $cacheKey = 'rawg_calendar_' . $startDate . '_' . $endDate;

        // return Cache::remember($cacheKey, 3600, function () use ($startDate, $endDate) {
        try {
            // Log the attempt
            \Illuminate\Support\Facades\Log::info("Fetching RAWG Calendar: $startDate to $endDate with Key: " . substr($this->apiKey, 0, 4) . '...');

            $response = Http::withoutVerifying()->timeout(15)->get("{$this->baseUrl}/games", [
                'key' => $this->apiKey,
                'dates' => "{$startDate},{$endDate}",
                'ordering' => '-added',
                'page_size' => 20,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            \Illuminate\Support\Facades\Log::error('RAWG API Error (Calendar)', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('RAWG API Exception (Calendar): ' . $e->getMessage());
        }

        return null;
        // });
    }
}
