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
     *
     * Fetches page 1 first to learn the total count, then fetches remaining
     * pages concurrently via Http::pool(). $maxPages caps how many pages to
     * fetch (pass 1 for widget/sidebar use, a large number for full-month view).
     */
    public function getReleases(string $from, string $to, string $ordering = 'released', int $maxPages = 2): ?array
    {
        $pageSize = 40;

        try {
            // ── Page 1: discover total count ─────────────────────────────
            $first = $this->http(15)->get("{$this->baseUrl}/games", [
                'key'       => $this->key(),
                'dates'     => "{$from},{$to}",
                'ordering'  => $ordering,
                'page_size' => $pageSize,
                'page'      => 1,
            ]);

            if (! $first->successful()) {
                return null;
            }

            $json    = $first->json();
            $total   = $json['count'] ?? 0;
            $results = $json['results'] ?? [];

            if (empty($results)) {
                return null;
            }

            // Clamp to pages actually available and the caller's cap
            $pagesAvailable = (int) ceil($total / $pageSize);
            $pagesNeeded    = min($pagesAvailable, $maxPages);

            if ($pagesNeeded <= 1) {
                return ['count' => $total, 'results' => $results];
            }

            // ── Pages 2-N in parallel ────────────────────────────────────
            $baseUrl = $this->baseUrl;
            $key     = $this->key();
            $ssl     = $this->verifySSL;

            $responses = Http::pool(function ($pool) use ($baseUrl, $key, $from, $to, $ordering, $pageSize, $pagesNeeded, $ssl) {
                $requests = [];
                for ($p = 2; $p <= $pagesNeeded; $p++) {
                    $opts = ['force_ip_resolve' => 'v4'];
                    if (! $ssl) {
                        $opts['verify'] = false;
                    }
                    $requests[] = $pool->timeout(20)
                        ->withOptions($opts)
                        ->get("{$baseUrl}/games", [
                            'key'       => $key,
                            'dates'     => "{$from},{$to}",
                            'ordering'  => $ordering,
                            'page_size' => $pageSize,
                            'page'      => $p,
                        ]);
                }

                return $requests;
            });

            foreach ($responses as $response) {
                if (! ($response instanceof \Throwable) && $response->successful()) {
                    $results = array_merge($results, $response->json()['results'] ?? []);
                }
            }

            return ['count' => $total, 'results' => $results];

        } catch (\Exception $e) {
            Log::error('RawgService getReleases: '.$e->getMessage());

            return null;
        }
    }
}
