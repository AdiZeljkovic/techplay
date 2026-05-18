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
        $client = Http::timeout($timeout);
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
                'key'       => $this->key(),
                'search'    => $query,
                'page_size' => 10,
            ]);
            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('RawgService searchGames: ' . $e->getMessage());
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
            Log::error('RawgService getGameDetails: ' . $e->getMessage());
            return null;
        }
    }
}
