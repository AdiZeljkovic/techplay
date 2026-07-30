<?php

namespace App\Services;

use App\Events\PresenceUpdated;
use App\Models\Game;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Str;

class PresenceService
{
    public function set(User $user, string $gameName, string $source = 'manual'): Presence
    {
        $game = Game::where('name', $gameName)
            ->orWhere('slug', Str::slug($gameName))
            ->first();

        $existing = Presence::where('user_id', $user->id)->first();

        $sameGame = $existing && mb_strtolower($existing->game_name) === mb_strtolower($gameName);

        $presence = Presence::updateOrCreate(
            ['user_id' => $user->id],
            [
                'game_id' => $game?->id,
                'game_name' => $gameName,
                'game_slug' => $game?->slug,
                'source' => $source,
                'is_active' => true,
                'started_at' => $sameGame ? ($existing->started_at ?? now()) : now(),
            ]
        );

        // Live play signal → Continue Playing recency on the dashboard
        if ($game) {
            UserGame::where('user_id', $user->id)
                ->where('game_id', $game->id)
                ->update(['last_played_at' => now()]);
        }

        broadcast(new PresenceUpdated(
            userId: $user->id,
            gameName: $presence->game_name,
            gameSlug: $presence->game_slug,
            source: $presence->source,
            startedAt: $presence->started_at->toIso8601String(),
        ))->toOthers();

        return $presence;
    }

    public function clear(User $user): void
    {
        Presence::where('user_id', $user->id)->update(['is_active' => false]);

        broadcast(new PresenceUpdated(
            userId: $user->id,
            gameName: null,
            gameSlug: null,
            source: null,
            startedAt: null,
        ))->toOthers();
    }

    public function getActive(User $user): ?Presence
    {
        return Presence::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();
    }

    public function getActiveByUserId(int $userId): ?Presence
    {
        return Presence::where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }
}
