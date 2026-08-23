<?php

namespace App\Services;

use App\Models\GameRating;
use App\Models\PlaySession;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
                        'cover_url' => $game->cover_url,
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
     * The years a player has behind them, built only from dates that are real.
     *
     * Three dated sources, and they agree on nothing by accident: when a game
     * was last opened (`rtime_last_played`, kept since 23 Aug 2026 — 102 games
     * on a real library, 2016 to 2026), when each achievement was unlocked
     * (937 of them, to the minute), and when something was finished.
     *
     * What this deliberately does not report is hours per year. Steam gives one
     * lifetime total per game and nothing time-sliced, so attributing it to the
     * year the game was last opened invents a year that never happened: on the
     * library this was written against, 2024 would read as 1,616 hours, of
     * which 1,602 belong to an MMO played across five years and closed that
     * one. Achievements are the honest measure of a year, because each carries
     * the moment it happened. `hours_held` is offered beside the games — the
     * hours those particular games hold, which is a different claim and is
     * labelled as one.
     */
    public function history(User $user): array
    {
        $entries = UserGame::where('user_id', $user->id)
            ->whereNotNull('last_played_at')
            ->with('game:id,slug,name,cover_url')
            ->orderByDesc('last_played_at')
            ->get()
            ->filter(fn (UserGame $ug) => $ug->game !== null);

        // Grouped in PHP rather than SQL: date formatting is the one place
        // Postgres and the SQLite the suite runs on refuse to agree, and one
        // reader's unlocks are a few thousand rows at most.
        $unlockRows = DB::table('steam_achievements')
            ->where('user_id', $user->id)
            ->where('achieved', true)
            ->whereNotNull('achieved_at')
            ->get(['achieved_at', 'game_id'])
            ->groupBy(fn ($row) => Carbon::parse($row->achieved_at)->format('Y'));

        $unlocks = $unlockRows->map(fn ($rows) => $rows->count());
        $unlockGames = $unlockRows->map(fn ($rows) => $rows->pluck('game_id')->filter()->unique()->count());

        $finished = UserGame::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->with('game:id,slug,name,cover_url')
            ->get()
            ->filter(fn (UserGame $ug) => $ug->game !== null)
            ->groupBy(fn (UserGame $ug) => $ug->completed_at->format('Y'));

        $byYear = $entries->groupBy(fn (UserGame $ug) => $ug->last_played_at->format('Y'));

        // Every year that any of the three sources knows about, newest first.
        $years = collect($byYear->keys())
            ->merge($unlocks->keys())
            ->merge($finished->keys())
            ->unique()
            ->sortDesc()
            ->values();

        $rows = $years->map(function (string $year) use ($byYear, $unlocks, $unlockGames, $finished) {
            $games = ($byYear[$year] ?? collect())->take(12);

            return [
                'year' => (int) $year,
                'games_left_off' => ($byYear[$year] ?? collect())->count(),
                // The hours those games hold in total — not hours played that
                // year, which nothing can tell us.
                'hours_held' => (int) ($byYear[$year] ?? collect())->sum('hours_played'),
                'unlocks' => (int) ($unlocks[$year] ?? 0),
                'unlock_games' => (int) ($unlockGames[$year] ?? 0),
                'games' => $games->map(fn (UserGame $ug) => [
                    'slug' => $ug->game->slug,
                    'name' => $ug->game->name,
                    'cover_url' => $ug->game->cover_url,
                    'hours' => (int) ($ug->hours_played ?? 0),
                    'status' => $ug->status,
                    'platform' => $ug->platform,
                ])->values()->all(),
                'finished' => ($finished[$year] ?? collect())->map(fn (UserGame $ug) => [
                    'slug' => $ug->game->slug,
                    'name' => $ug->game->name,
                    'cover_url' => $ug->game->cover_url,
                ])->values()->all(),
            ];
        });

        // Minutes per device, summed across the shelf. Partial by nature:
        // Steam only began attributing playtime to a device a few years in, so
        // older hours belong to no machine. The frontend says so rather than
        // letting the gap read as missing games.
        $devices = [];
        foreach ($entries->merge(UserGame::where('user_id', $user->id)->whereNotNull('device_playtime')->get()) as $ug) {
            foreach ((array) ($ug->device_playtime ?? []) as $device => $minutes) {
                $devices[$device] = ($devices[$device] ?? 0) + (int) $minutes;
            }
        }
        arsort($devices);

        $totalMinutes = (int) UserGame::where('user_id', $user->id)->sum('playtime_minutes');
        $attributed = array_sum(array_diff_key($devices, ['offline' => true]));

        return [
            'years' => $rows->all(),
            'span' => $years->isEmpty() ? null : [
                'from' => (int) $years->last(),
                'to' => (int) $years->first(),
            ],
            'totals' => [
                'hours' => (int) round($totalMinutes / 60),
                'games_with_time' => UserGame::where('user_id', $user->id)->where('playtime_minutes', '>', 0)->count(),
                'unlocks' => (int) $unlocks->sum(),
            ],
            'devices' => [
                'minutes' => $devices,
                // What Steam could place, against everything it counted.
                'attributed_hours' => (int) round($attributed / 60),
                'total_hours' => (int) round($totalMinutes / 60),
            ],
        ];
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
            ->with('game:id,slug,name,cover_url')
            ->orderByDesc('completed_at')
            ->limit($limit)
            ->get()
            ->filter(fn (UserGame $ug) => $ug->game !== null)
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game->slug,
                'name' => $ug->game->name,
                'cover_url' => $ug->game->cover_url,
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
            ->with('game:id,slug,name,cover_url')
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
                    'cover_url' => $r->game->cover_url,
                ] : ['slug' => $r->game_slug, 'name' => $r->game_slug, 'cover_url' => null],
            ])
            ->all();
    }
}
