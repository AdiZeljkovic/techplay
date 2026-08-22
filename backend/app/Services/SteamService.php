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
        // `l` is not optional in practice. Without a language Steam answers
        // with the bare api name, `achieved` and `unlocktime` and nothing
        // else — which is why the first real import stored 448 achievements
        // with a null display_name and null description apiece, and the
        // profile panel had 448 blank rows to draw. Asking for a language is
        // what makes Steam send the words.
        //
        // Icons are a different endpoint (GetSchemaForGame) and still arrive
        // null from here; that is a separate call, not a missing parameter.
        $response = Http::timeout(10)->get("{$this->baseUrl}/ISteamUserStats/GetPlayerAchievements/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'appid' => $appId,
            'l' => 'english',
        ]);

        if (! $response->ok() || $response->json('playerstats.success') !== true) {
            return [];
        }

        return $response->json('playerstats.achievements', []);
    }

    /**
     * Batch player summaries — up to 100 Steam IDs per call.
     * Returns array of player summary objects keyed by steamid.
     */
    public function getPlayerSummariesBatch(array $steamIds): array
    {
        if (empty($steamIds)) {
            return [];
        }

        $response = Http::timeout(15)->get("{$this->baseUrl}/ISteamUser/GetPlayerSummaries/v2/", [
            'key' => $this->apiKey,
            'steamids' => implode(',', $steamIds),
        ]);

        if (! $response->ok()) {
            Log::warning('Steam GetPlayerSummaries batch failed', ['status' => $response->status()]);

            return [];
        }

        return $response->json('response.players', []);
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
