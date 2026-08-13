<?php

namespace App\Services;

use App\Models\PlaySession;
use App\Models\SessionSuggestion;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Facades\DB;

/**
 * Sessions the site noticed on your behalf.
 *
 * The journal asked people to sit down and write, which is why almost nobody
 * ever did. Steam has been reporting lifetime playtime per game the whole time,
 * and we ask it on a schedule — the difference between two readings is a
 * session that happened. This turns that difference into a proposal.
 *
 * A proposal, never a fact. "Steam counted 140 minutes" and "I played for a bit
 * last night" are different claims, and only the second one belongs in a diary,
 * so nothing reaches the journal until a person says yes.
 */
class SessionSuggestionService
{
    /**
     * A new playtime reading for one game.
     *
     * The first reading for an entry is a baseline, not a session: Steam
     * reports a lifetime figure, and an account connected today would
     * otherwise be told it played for three hundred hours yesterday.
     */
    public function noticeSteamPlaytime(UserGame $entry, int $totalMinutes): void
    {
        $seen = $entry->playtime_seen_minutes;

        // Nothing to compare against yet. Record the floor and wait.
        if ($seen === null) {
            $entry->forceFill(['playtime_seen_minutes' => $totalMinutes])->save();

            return;
        }

        $gained = $totalMinutes - (int) $seen;

        if ($gained < SessionSuggestion::MIN_MINUTES || $gained > SessionSuggestion::MAX_MINUTES) {
            return;
        }

        $this->propose($entry->user_id, $entry->game_id, $gained);
    }

    /**
     * File a suggestion for today, or top up the one already waiting.
     *
     * Playing in three bursts across an evening should read as one session in
     * the morning, not three rows to dismiss one at a time.
     */
    public function propose(int $userId, int $gameId, int $minutes, string $source = 'steam'): void
    {
        $today = now()->toDateString();

        DB::transaction(function () use ($userId, $gameId, $minutes, $source, $today) {
            $existing = SessionSuggestion::where('user_id', $userId)
                ->where('game_id', $gameId)
                ->whereDate('played_on', $today)
                ->lockForUpdate()
                ->first();

            // Already answered today. Somebody who dismissed a game this
            // morning does not want it proposed again this afternoon.
            if ($existing && $existing->status !== 'pending') {
                return;
            }

            if ($existing) {
                $existing->increment('minutes', $minutes);

                return;
            }

            SessionSuggestion::create([
                'user_id' => $userId,
                'game_id' => $gameId,
                'minutes' => $minutes,
                'source' => $source,
                'played_on' => $today,
                'status' => 'pending',
            ]);
        });
    }

    /**
     * What is waiting to be confirmed, newest first.
     *
     * Capped: a library synced after a long absence can produce a dozen at
     * once, and a wall of prompts is a thing to close rather than answer.
     */
    public function pending(User $user, int $limit = 5): array
    {
        return SessionSuggestion::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('game:id,slug,name,cover_url')
            ->orderByDesc('played_on')
            ->orderByDesc('minutes')
            ->limit($limit)
            ->get()
            ->filter(fn (SessionSuggestion $s) => $s->game !== null)
            ->map(fn (SessionSuggestion $s) => [
                'id' => $s->id,
                'minutes' => $s->minutes,
                'played_on' => $s->played_on->toDateString(),
                'source' => $s->source,
                'game' => [
                    'slug' => $s->game->slug,
                    'name' => $s->game->name,
                    'cover_url' => $s->game->cover_url,
                ],
            ])
            ->values()
            ->all();
    }

    /**
     * Turn a suggestion into a real entry.
     *
     * The reader may correct the number on the way in — Steam counts time in
     * the pause menu and time spent making a sandwich, and the person who was
     * there knows better than the clock did.
     */
    public function accept(SessionSuggestion $suggestion, ?int $minutes = null): PlaySession
    {
        $session = PlaySession::create([
            'user_id' => $suggestion->user_id,
            'game_id' => $suggestion->game_id,
            'played_on' => $suggestion->played_on,
            'minutes' => max(1, $minutes ?? $suggestion->minutes),
            'platform' => 'PC',
            'is_private' => false,
            'has_spoilers' => false,
        ]);

        $suggestion->update(['status' => 'accepted']);

        return $session;
    }
}
