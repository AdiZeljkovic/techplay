<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameExternalId;
use Illuminate\Support\Str;

class GameMatchingService
{
    /**
     * Match a Steam game (appid + name) to a local Game record.
     * Strategy: exact external_id lookup → normalised-name exact → slug-based → null.
     */
    public function matchSteamGame(int $appId, string $name): ?Game
    {
        // 1. Trusted external ID mapping
        $ext = GameExternalId::where('provider', 'steam')
            ->where('external_id', (string) $appId)
            ->with('game')
            ->first();

        if ($ext) {
            return $ext->game;
        }

        // 2. Exact name match (case-insensitive)
        $game = Game::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
        if ($game) {
            $this->storeExternalId($game->id, 'steam', (string) $appId);

            return $game;
        }

        // 3. Slug match from game name
        $slug = Str::slug($name);
        $game = Game::where('slug', $slug)->first();
        if ($game) {
            $this->storeExternalId($game->id, 'steam', (string) $appId);

            return $game;
        }

        // 4. Fuzzy: remove common suffixes (™, ®, DLC markers, years) and retry
        $normalized = $this->normalizeTitle($name);
        if ($normalized !== strtolower($name)) {
            $game = Game::whereRaw('LOWER(name) = ?', [$normalized])->first();
            if ($game) {
                $this->storeExternalId($game->id, 'steam', (string) $appId);

                return $game;
            }
        }

        return null;
    }

    /**
     * Match a game purely by title (CSV/manual imports) — exact name,
     * slug, then normalized-title fallback.
     */
    public function matchByName(string $name): ?Game
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }

        $game = Game::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
        if ($game) {
            return $game;
        }

        $game = Game::where('slug', Str::slug($name))->first();
        if ($game) {
            return $game;
        }

        $normalized = $this->normalizeTitle($name);
        if ($normalized !== strtolower($name)) {
            return Game::whereRaw('LOWER(name) = ?', [$normalized])->first();
        }

        return null;
    }

    private function normalizeTitle(string $name): string
    {
        // Strip trademark symbols, roman numerals at end, "Game of the Year" suffixes, etc.
        $name = preg_replace('/[™®©]/u', '', $name);
        $name = preg_replace('/\s+[\-–:]\s*(game of the year|goty|complete edition|definitive edition|remastered|deluxe edition|gold edition).*/i', '', $name);
        $name = preg_replace('/\s*\(\d{4}\)\s*$/', '', $name); // trailing year

        return strtolower(trim($name));
    }

    private function storeExternalId(int $gameId, string $provider, string $externalId): void
    {
        GameExternalId::firstOrCreate(
            ['provider' => $provider, 'external_id' => $externalId],
            ['game_id' => $gameId]
        );
    }
}
