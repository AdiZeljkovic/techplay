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
    /**
     * The library, or null when Steam declines to say.
     *
     * Steam answers a refusal with `{"response":{}}` and a genuinely empty
     * library with `{"response":{"game_count":0,"games":[]}}` — a 200 either
     * way. This used to read `response.games` with `[]` as the default, which
     * flattened the two into the same answer: an account whose Game details
     * privacy is not public synced in three seconds, wrote nothing, and was
     * marked done. The reader was told "Synced" and shown an empty shelf,
     * with no hint that the fix was one setting on their side.
     *
     * The tell is the whole object being empty. Steam sends `game_count` with
     * every real answer and `games` with every non-empty one — an account that
     * owns nothing still gets `{"game_count":0}` — so `{}` and only `{}` means
     * refused. Null travels up so the caller can say which happened.
     */
    public function getOwnedGames(string $steamId): ?array
    {
        $response = Http::timeout(15)->get("{$this->baseUrl}/IPlayerService/GetOwnedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId,
            'include_appinfo' => 1,
            'include_played_free_games' => 1,
        ]);

        if (! $response->ok()) {
            Log::warning("Steam GetOwnedGames failed for {$steamId}", ['status' => $response->status()]);

            return null;
        }

        $payload = $response->json('response');

        if (! is_array($payload) || $payload === []) {
            Log::info("Steam withheld the library for {$steamId} — game details are not public");

            return null;
        }

        return $payload['games'] ?? [];
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
