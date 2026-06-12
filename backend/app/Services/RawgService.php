<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RawgService
{
    protected string $baseUrl = 'https://api.rawg.io/api';

    protected bool $verifySSL;

    public function __construct()
    {
        $this->verifySSL = ! app()->environment('local');
    }

    protected function http(int $timeout = 15)
    {
        $client = Http::timeout($timeout)
            ->connectTimeout(10)
            // Force IPv4 — PHP cURL on some hosts resolves IPv6 first and times out
            ->withOptions(['force_ip_resolve' => 'v4']);
        if (! $this->verifySSL) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    protected function key(): string
    {
        $key = config('services.rawg.api_key', '');
        if (! $key) {
            throw new \RuntimeException('RAWG_API_KEY not set in .env');
        }

        return $key;
    }

    public function searchGames(string $query): ?array
    {
        try {
            $response = $this->http(10)->get("{$this->baseUrl}/games", [
                'key' => $this->key(),
                'search' => $query,
                'page_size' => 10,
            ]);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('RawgService searchGames: '.$e->getMessage());

            return null;
        }
    }

    public function getGameDetails(string $slug): ?array
    {
        try {
            $response = $this->http(15)->get("{$this->baseUrl}/games/{$slug}", [
                'key' => $this->key(),
            ]);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('RawgService getGameDetails: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Get game releases in a date range (for the release calendar).
     * Fetches up to $maxPages pages of 40 results and merges them.
     */
    public function getReleases(string $from, string $to, string $ordering = 'released', int $maxPages = 2): ?array
    {
        try {
            $results = [];
            $count = 0;

            for ($page = 1; $page <= $maxPages; $page++) {
                $response = $this->http(15)->get("{$this->baseUrl}/games", [
                    'key' => $this->key(),
                    'dates' => "{$from},{$to}",
                    'ordering' => $ordering,
                    'page_size' => 40,
                    'page' => $page,
                ]);

                if (! $response->successful()) {
                    break;
                }

                $json = $response->json();
                $count = $json['count'] ?? 0;
                $results = array_merge($results, $json['results'] ?? []);

                if (empty($json['next'])) {
                    break;
                }
            }

            if (empty($results)) {
                return null;
            }

            return ['count' => $count, 'results' => $results];
        } catch (\Exception $e) {
            Log::error('RawgService getReleases: '.$e->getMessage());

            return null;
        }
    }
}
