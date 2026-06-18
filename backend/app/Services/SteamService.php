<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SteamService
{
    private string $apiKey;

    private string $baseUrl = 'https://api.steampowered.com';

    public function __construct()
    {
        $this->apiKey = config('services.steam.key', '');
    }

    /**
     * All games owned by a Steam user, with playtime in minutes.
     */
    public function getOwnedGames(string $steamId): array
    {
        $response = Http::timeout(15)->get("{$this->baseUrl}/IPlayerService/GetOwnedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'include_appinfo' => 1,
            'include_played_free_games' => 1,
        ]);

        if (! $response->ok()) {
            Log::warning("Steam GetOwnedGames failed for {$steamId}", ['status' => $response->status()]);

            return [];
        }

        return $response->json('response.games', []);
    }

    /**
     * Last 2 weeks of recently played games.
     */
    public function getRecentlyPlayedGames(string $steamId): array
    {
        $response = Http::timeout(10)->get("{$this->baseUrl}/IPlayerService/GetRecentlyPlayedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'count' => 20,
        ]);

        if (! $response->ok()) {
            return [];
        }

        return $response->json('response.games', []);
    }

    /**
     * Basic profile info (persona name, avatar, profile URL).
     */
    public function getPlayerSummary(string $steamId): ?array
    {
        $response = Http::timeout(10)->get("{$this->baseUrl}/ISteamUser/GetPlayerSummaries/v2/", [
            'key' => $this->apiKey,
            'steamids' => $steamId,
        ]);

        if (! $response->ok()) {
            return null;
        }

        $players = $response->json('response.players', []);

        return $players[0] ?? null;
    }

    /**
     * Achievements for a specific game.
     */
    public function getPlayerAchievements(string $steamId, int $appId): array
    {
        $response = Http::timeout(10)->get("{$this->baseUrl}/ISteamUserStats/GetPlayerAchievements/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'appid' => $appId,
        ]);

        if (! $response->ok() || $response->json('playerstats.success') !== true) {
            return [];
        }

        return $response->json('playerstats.achievements', []);
    }

    /**
     * Resolve a Steam vanity URL (custom profile name) to a Steam64 ID.
     */
    public function resolveVanityUrl(string $vanityUrl): ?string
    {
        $response = Http::timeout(10)->get("{$this->baseUrl}/ISteamUser/ResolveVanityURL/v1/", [
            'key' => $this->apiKey,
            'vanityurl' => $vanityUrl,
        ]);

        if (! $response->ok() || $response->json('response.success') !== 1) {
            return null;
        }

        return $response->json('response.steamid');
    }
}
