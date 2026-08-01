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
    /**
     * A session longer than this is a stale presence the client never closed
     * (a crash, a machine left on) rather than a real sitting — banking it
     * would silently inflate the library.
     */
    private const MAX_SESSION_MINUTES = 12 * 60;

    /** Below this a "session" is a presence flicker, not play. */
    private const MIN_SESSION_MINUTES = 2;

    public function set(User $user, string $gameName, string $source = 'manual'): Presence
    {
        $game = Game::where('name', $gameName)
            ->orWhere('slug', Str::slug($gameName))
            ->first();

        $existing = Presence::where('user_id', $user->id)->first();

        $sameGame = $existing && mb_strtolower($existing->game_name) === mb_strtolower($gameName);

        // Switching titles closes the previous session — bank it first.
        if ($existing && ! $sameGame) {
            $this->bankSession($user, $existing);
        }

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
        $presence = Presence::where('user_id', $user->id)->where('is_active', true)->first();

        if ($presence) {
            $this->bankSession($user, $presence);
        }

        Presence::where('user_id', $user->id)->update(['is_active' => false]);

        broadcast(new PresenceUpdated(
            userId: $user->id,
            gameName: null,
            gameSlug: null,
            source: null,
            startedAt: null,
        ))->toOthers();
    }

    /**
     * Add a finished presence session to the library entry's playtime.
     *
     * Only titles already in the collection are credited — presence can name
     * anything, and we will not invent library rows from a Discord status.
     * Steam's total is authoritative, so entries it owns are left untouched.
     */
    private function bankSession(User $user, Presence $presence): void
    {
        if (! $presence->game_id || ! $presence->started_at || ! $presence->is_active) {
            return;
        }

        $minutes = (int) $presence->started_at->diffInMinutes(now());

        if ($minutes < self::MIN_SESSION_MINUTES || $minutes > self::MAX_SESSION_MINUTES) {
            return;
        }

        $entry = UserGame::where('user_id', $user->id)
            ->where('game_id', $presence->game_id)
            ->first();

        if (! $entry || $entry->playtime_source === 'steam') {
            return;
        }

        $entry->playtime_minutes = (int) $entry->playtime_minutes + $minutes;
        $entry->hours_played = intdiv($entry->playtime_minutes, 60);
        $entry->playtime_source = $presence->source === 'discord' ? 'discord' : 'presence';
        $entry->last_played_at = now();
        $entry->save();
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
