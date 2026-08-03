<?php

namespace App\Services;

use App\Models\GameRating;
use App\Models\PlaySession;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Everything the journal knows how to say about a player, derived from their
 * sessions. Nothing here is stored twice — the aggregates are read from
 * `play_sessions` on request, so editing a session corrects the calendar,
 * the totals and the per-game hours at once.
 */
class JournalService
{
    /**
     * Push logged minutes back onto the collection entry.
     *
     * The Steam sync is authoritative for the games it can see — it reads the
     * real client. Journal minutes fill in everywhere Steam doesn't reach, and
     * never overwrite a Steam figure.
     */
    public function syncPlaytime(User $user, int $gameId): void
    {
        $entry = UserGame::where('user_id', $user->id)->where('game_id', $gameId)->first();

        if (! $entry || $entry->playtime_source === 'steam') {
            return;
        }

        $minutes = (int) PlaySession::where('user_id', $user->id)->where('game_id', $gameId)->sum('minutes');

        if ($minutes <= 0) {
            return;
        }

        $entry->forceFill([
            'playtime_minutes' => $minutes,
            'playtime_source' => 'journal',
            // Wrapped and the older widgets read hours_played; keep it true.
            'hours_played' => (int) round($minutes / 60),
            'last_played_at' => PlaySession::where('user_id', $user->id)
                ->where('game_id', $gameId)->max('played_on') ?? $entry->last_played_at,
        ])->save();
    }

    /**
     * The journal's headline numbers.
     */
    public function summary(User $user, Collection $sessions): array
    {
        $minutes = (int) $sessions->sum('minutes');

        $byMonth = $sessions->groupBy(fn (PlaySession $s) => $s->played_on->format('Y-m'))
            ->map(fn (Collection $rows) => (int) $rows->sum('minutes'))
            ->sortDesc();

        $busiest = $byMonth->keys()->first();

        return [
            'sessions' => $sessions->count(),
            'minutes' => $minutes,
            'hours' => (int) round($minutes / 60),
            'games' => $sessions->pluck('game_id')->unique()->count(),
            'days' => $sessions->pluck('played_on')->map(fn ($d) => $d->toDateString())->unique()->count(),
            'busiest_month' => $busiest ? [
                'month' => $busiest,
                'label' => Carbon::createFromFormat('Y-m', $busiest)->format('F Y'),
                'minutes' => $byMonth->first(),
            ] : null,
            'current_streak' => $this->streak($sessions),
        ];
    }

    /**
     * Consecutive days ending today or yesterday — a streak that broke last
     * week isn't a streak, it's a memory.
     */
    private function streak(Collection $sessions): int
    {
        $days = $sessions->pluck('played_on')->map(fn ($d) => $d->toDateString())->unique()->sort()->values();

        if ($days->isEmpty()) {
            return 0;
        }

        $last = Carbon::parse($days->last());

        if ($last->diffInDays(now()->startOfDay()) > 1) {
            return 0;
        }

        $streak = 1;
        for ($i = $days->count() - 1; $i > 0; $i--) {
            $current = Carbon::parse($days[$i]);
            $previous = Carbon::parse($days[$i - 1]);

            // Carbon returns a signed float here — compare as whole days.
            if ((int) round(abs($previous->diffInDays($current))) !== 1) {
                break;
            }
            $streak++;
        }

        return $streak;
    }

    /**
     * One cell per day for the calendar heat map, plus the per-day totals the
     * UI needs to pick an intensity.
     */
    public function calendar(Collection $sessions): array
    {
        return $sessions->groupBy(fn (PlaySession $s) => $s->played_on->toDateString())
            ->map(fn (Collection $rows, string $day) => [
                'date' => $day,
                'minutes' => (int) $rows->sum('minutes'),
                'sessions' => $rows->count(),
                'games' => $rows->pluck('game.name')->filter()->unique()->take(3)->values()->all(),
            ])
            ->values()
            ->sortBy('date')
            ->values()
            ->all();
    }

    /**
     * Where the hours actually went.
     */
    public function perGame(Collection $sessions, int $limit = 8): array
    {
        $total = max(1, (int) $sessions->sum('minutes'));

        return $sessions->groupBy('game_id')
            ->map(function (Collection $rows) use ($total) {
                $game = $rows->first()->game;
                $minutes = (int) $rows->sum('minutes');

                return [
                    'game' => $game ? [
                        'slug' => $game->slug,
                        'name' => $game->name,
                        'background_image' => $game->background_image,
                    ] : null,
                    'minutes' => $minutes,
                    'sessions' => $rows->count(),
                    'percent' => (int) round($minutes / $total * 100),
                    'last_played' => $rows->max('played_on')?->toDateString(),
                ];
            })
            ->filter(fn (array $row) => $row['game'] !== null)
            ->sortByDesc('minutes')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * The completed timeline — finishes, in the order they happened. Read off
     * the collection's own `completed_at`, which has always been recorded and
     * has never been shown as a history.
     */
    public function completedTimeline(User $user, int $limit = 20): array
    {
        return UserGame::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->with('game:id,slug,name,background_image')
            ->orderByDesc('completed_at')
            ->limit($limit)
            ->get()
            ->filter(fn (UserGame $ug) => $ug->game !== null)
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game->slug,
                'name' => $ug->game->name,
                'background_image' => $ug->game->background_image,
                'completed_at' => $ug->completed_at?->toDateString(),
                'hours' => (int) ($ug->hours_played ?? 0),
                'from_backlog' => (bool) $ug->from_backlog,
            ])
            ->values()
            ->all();
    }

    /**
     * Published reviews, surfaced rather than re-implemented — GameRating has
     * held these since long before the journal existed.
     */
    public function reviews(User $user, int $limit = 10): array
    {
        return GameRating::where('user_id', $user->id)
            ->where('is_draft', false)
            ->whereNotNull('review')
            ->with('game:id,slug,name,background_image')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (GameRating $r) => [
                'id' => $r->id,
                'rating' => (float) $r->rating,
                'review' => $r->review,
                'created_at' => $r->created_at?->toIso8601String(),
                'game' => $r->game ? [
                    'slug' => $r->game->slug,
                    'name' => $r->game->name,
                    'background_image' => $r->game->background_image,
                ] : ['slug' => $r->game_slug, 'name' => $r->game_slug, 'background_image' => null],
            ])
            ->all();
    }
}
