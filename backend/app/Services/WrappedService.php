<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * A year, read back. Everything here is counted inside the year's window and
 * compared against the same window a year earlier — and where last year holds
 * nothing, the comparison is simply absent rather than a flattering +100%.
 */
class WrappedService
{
    /** Below this many players, a percentile is noise. Same rule as everywhere. */
    private const PERCENTILE_MIN_POPULATION = 30;

    public function build(User $user, int $year): array
    {
        return Cache::remember("wrapped.{$user->id}.{$year}.v2", 1800, function () use ($user, $year) {
            $now = $this->totals($user, $year);
            $before = $this->totals($user, $year - 1);

            return [
                'year' => $year,
                'username' => $user->username,
                'display_name' => $user->display_name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'level' => app(LevelService::class)->forXp($user->xp),
                'has_data' => array_sum([$now['games_played'], $now['hours'], $now['achievements']]) > 0,

                'stats' => $this->withDeltas($now, $before),
                'top_games' => $this->topGames($user, $year),
                'dna' => $this->dna($user, $year),
                'timeline' => $this->timeline($user, $year),
                'moments' => $this->moments($user, $year),
                'percentiles' => $this->percentiles($user, $year, $now),
                'community' => $this->community($user, $year, $before),
                'archetype' => $this->archetype($user, $year),
            ];
        });
    }

    /* ── the numbers ──────────────────────────────────────────────────── */

    /** @return array<string,int> */
    private function totals(User $user, int $year): array
    {
        [$start, $end] = $this->window($year);

        $sessions = DB::table('play_sessions')
            ->where('user_id', $user->id)
            ->whereBetween('played_on', [$start->toDateString(), $end->toDateString()]);

        // Hours come from logged sessions where they exist, and fall back to
        // the collection's own figure for a year played before the journal.
        $journalMinutes = (int) $sessions->clone()->sum('minutes');

        $collectionHours = (int) DB::table('user_games')
            ->where('user_id', $user->id)
            ->whereBetween('updated_at', [$start, $end])
            ->sum('hours_played');

        return [
            'games_played' => (int) DB::table('user_games')
                ->where('user_id', $user->id)
                ->whereBetween('updated_at', [$start, $end])
                ->whereIn('status', ['playing', 'completed', 'dropped'])
                ->count(),
            'games_completed' => (int) DB::table('user_games')
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('completed_at', [$start, $end])
                ->count(),
            'hours' => $journalMinutes > 0 ? (int) round($journalMinutes / 60) : $collectionHours,
            'reviews' => (int) DB::table('game_ratings')
                ->where('user_id', $user->id)
                ->where('is_draft', false)
                ->whereNotNull('review')
                ->whereBetween('created_at', [$start, $end])
                ->count(),
            'achievements' => (int) DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->whereBetween('unlocked_at', [$start, $end])
                ->count(),
            'streak' => $this->longestStreak($user, $year),
        ];
    }

    /**
     * The longest run of consecutive days with a logged session. A real
     * streak of playing, not the login streak the profile already shows.
     */
    private function longestStreak(User $user, int $year): int
    {
        [$start, $end] = $this->window($year);

        $days = DB::table('play_sessions')
            ->where('user_id', $user->id)
            ->whereBetween('played_on', [$start->toDateString(), $end->toDateString()])
            ->distinct()
            ->orderBy('played_on')
            ->pluck('played_on')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->unique()
            ->values();

        if ($days->isEmpty()) {
            return 0;
        }

        $longest = 1;
        $run = 1;

        for ($i = 1; $i < $days->count(); $i++) {
            $gap = Carbon::parse($days[$i - 1])->diffInDays(Carbon::parse($days[$i]));

            $run = (int) round(abs($gap)) === 1 ? $run + 1 : 1;
            $longest = max($longest, $run);
        }

        return $longest;
    }

    /**
     * Each figure with last year beside it — and no delta at all when last
     * year was empty, because a jump from nothing is not a percentage.
     */
    private function withDeltas(array $now, array $before): array
    {
        $labels = [
            'games_played' => 'Games played',
            'games_completed' => 'Games completed',
            'hours' => 'Hours played',
            'reviews' => 'Reviews written',
            'achievements' => 'Achievements unlocked',
            'streak' => 'Longest streak',
        ];

        return collect($labels)->map(function (string $label, string $key) use ($now, $before) {
            $current = $now[$key];
            $previous = $before[$key];

            return [
                'key' => $key,
                'label' => $label,
                'value' => $current,
                'previous' => $previous,
                'delta_percent' => $previous > 0 ? (int) round(($current - $previous) / $previous * 100) : null,
            ];
        })->values()->all();
    }

    /* ── the panels ───────────────────────────────────────────────────── */

    private function topGames(User $user, int $year, int $limit = 5): array
    {
        [$start, $end] = $this->window($year);

        // Journal hours per game this year, which is the honest ranking when
        // sessions exist; the collection's own total backs it up.
        $sessionMinutes = DB::table('play_sessions')
            ->where('user_id', $user->id)
            ->whereBetween('played_on', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('game_id, SUM(minutes) as minutes')
            ->groupBy('game_id')
            ->pluck('minutes', 'game_id');

        return DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereBetween('user_games.updated_at', [$start, $end])
            ->get(['games.id', 'games.name', 'games.slug', 'games.cover_url', 'user_games.hours_played', 'user_games.status'])
            ->map(fn ($row) => [
                'name' => $row->name,
                'slug' => $row->slug,
                'cover_url' => $row->cover_url,
                'status' => $row->status,
                'hours' => isset($sessionMinutes[$row->id])
                    ? (int) round($sessionMinutes[$row->id] / 60)
                    : (int) $row->hours_played,
            ])
            ->sortByDesc('hours')
            ->take($limit)
            ->values()
            ->all();
    }

    private function dna(User $user, int $year): array
    {
        [$start, $end] = $this->window($year);

        $rows = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereBetween('user_games.updated_at', [$start, $end])
            ->pluck('games.genres');

        $tally = [];

        foreach ($rows as $raw) {
            foreach ($this->genresOf($raw) as $genre) {
                if (in_array($genre, ['Add-on', 'Compilation', 'Special edition'], true)) {
                    continue;
                }
                $tally[$genre] = ($tally[$genre] ?? 0) + 1;
            }
        }

        arsort($tally);
        $total = max(1, array_sum($tally));

        $genres = collect($tally)->take(7)->map(fn (int $count, string $name) => [
            'name' => $name,
            'count' => $count,
            'percent' => (int) round($count / $total * 100),
        ])->values()->all();

        return [
            'genres' => $genres,
            // Taste tags are the genres that actually earned a share, not a
            // fixed list every player gets.
            'tags' => collect($genres)->filter(fn (array $g) => $g['percent'] >= 6)->pluck('name')->take(6)->values()->all(),
        ];
    }

    /**
     * Five moments that actually happened, in the order they happened.
     * A month with nothing in it does not get a marker.
     */
    private function timeline(User $user, int $year): array
    {
        [$start, $end] = $this->window($year);
        $events = [];

        $firstCompletion = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->where('user_games.status', 'completed')
            ->whereBetween('user_games.completed_at', [$start, $end])
            ->orderBy('user_games.completed_at')
            ->first(['games.name', 'user_games.completed_at']);

        if ($firstCompletion) {
            $events[] = [
                'at' => $firstCompletion->completed_at,
                'key' => 'first_completion',
                'title' => 'First completed',
                'detail' => $firstCompletion->name,
            ];
        }

        // Grouped in PHP rather than SQL: date formatting is the one thing
        // Postgres and sqlite never agree on, and one user's year is small.
        $byMonth = DB::table('play_sessions')
            ->where('user_id', $user->id)
            ->whereBetween('played_on', [$start->toDateString(), $end->toDateString()])
            ->get(['played_on', 'minutes'])
            ->groupBy(fn ($row) => Carbon::parse($row->played_on)->format('Y-m'))
            ->map(fn ($rows) => (int) $rows->sum('minutes'))
            ->sortDesc();

        if ($byMonth->isNotEmpty() && $byMonth->first() > 0) {
            $events[] = [
                'at' => $byMonth->keys()->first().'-15',
                'key' => 'biggest_month',
                'title' => 'Biggest month',
                'detail' => round($byMonth->first() / 60).'h played',
            ];
        }

        $bigAchievement = DB::table('user_achievements')
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->where('user_achievements.user_id', $user->id)
            ->whereBetween('user_achievements.unlocked_at', [$start, $end])
            ->orderByDesc('achievements.points')
            ->first(['achievements.name', 'user_achievements.unlocked_at']);

        if ($bigAchievement) {
            $events[] = [
                'at' => $bigAchievement->unlocked_at,
                'key' => 'achievement',
                'title' => 'Biggest achievement',
                'detail' => $bigAchievement->name,
            ];
        }

        $longestSession = DB::table('play_sessions')
            ->join('games', 'games.id', '=', 'play_sessions.game_id')
            ->where('play_sessions.user_id', $user->id)
            ->whereBetween('play_sessions.played_on', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('play_sessions.minutes')
            ->first(['games.name', 'play_sessions.minutes', 'play_sessions.played_on']);

        if ($longestSession) {
            $events[] = [
                'at' => $longestSession->played_on,
                'key' => 'longest_session',
                'title' => 'Longest session',
                'detail' => $this->hhmm((int) $longestSession->minutes).' · '.$longestSession->name,
            ];
        }

        $bestReview = DB::table('game_ratings')
            ->join('games', 'games.id', '=', 'game_ratings.game_id')
            ->where('game_ratings.user_id', $user->id)
            ->where('game_ratings.is_draft', false)
            ->whereNotNull('game_ratings.review')
            ->whereBetween('game_ratings.created_at', [$start, $end])
            ->orderByDesc('game_ratings.rating')
            ->first(['games.name', 'game_ratings.rating', 'game_ratings.created_at']);

        if ($bestReview) {
            $events[] = [
                'at' => $bestReview->created_at,
                'key' => 'review',
                'title' => 'Highest rated',
                'detail' => $bestReview->name.' · '.number_format((float) $bestReview->rating, 1),
            ];
        }

        return collect($events)
            ->sortBy('at')
            ->map(fn (array $e) => array_merge($e, [
                'month' => Carbon::parse($e['at'])->format('M'),
                'at' => Carbon::parse($e['at'])->toDateString(),
            ]))
            ->values()
            ->all();
    }

    private function moments(User $user, int $year): array
    {
        [$start, $end] = $this->window($year);
        $moments = [];

        $top = $this->topGames($user, $year, 1);

        if ($top) {
            $moments[] = ['key' => 'most_played', 'label' => 'Most played', 'value' => $top[0]['name'], 'note' => $top[0]['hours'].'h', 'image' => $top[0]['cover_url']];
        }

        $dna = $this->dna($user, $year);

        if ($dna['genres']) {
            $moments[] = ['key' => 'genre', 'label' => 'Favourite genre', 'value' => $dna['genres'][0]['name'], 'note' => $dna['genres'][0]['percent'].'% of your year'];
        }

        $achievement = DB::table('user_achievements')
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->where('user_achievements.user_id', $user->id)
            ->whereBetween('user_achievements.unlocked_at', [$start, $end])
            ->orderByDesc('achievements.points')
            ->first(['achievements.name', 'achievements.points', 'achievements.id']);

        if ($achievement) {
            $moments[] = [
                'key' => 'achievement',
                'label' => 'Top achievement',
                'value' => $achievement->name,
                'note' => $achievement->points.' pts'.($this->rarityOf((int) $achievement->id) ?? ''),
            ];
        }

        $session = DB::table('play_sessions')
            ->join('games', 'games.id', '=', 'play_sessions.game_id')
            ->where('play_sessions.user_id', $user->id)
            ->whereBetween('play_sessions.played_on', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('play_sessions.minutes')
            ->first(['games.name', 'play_sessions.minutes', 'play_sessions.played_on']);

        if ($session) {
            $moments[] = [
                'key' => 'session',
                'label' => 'Longest session',
                'value' => $this->hhmm((int) $session->minutes),
                'note' => Carbon::parse($session->played_on)->format('M j').' · '.$session->name,
            ];
        }

        $review = DB::table('game_ratings')
            ->join('games', 'games.id', '=', 'game_ratings.game_id')
            ->where('game_ratings.user_id', $user->id)
            ->where('game_ratings.is_draft', false)
            ->whereNotNull('game_ratings.review')
            ->whereBetween('game_ratings.created_at', [$start, $end])
            ->orderByDesc('game_ratings.rating')
            ->first(['games.name', 'game_ratings.rating']);

        if ($review) {
            $moments[] = [
                'key' => 'review',
                'label' => 'Best review',
                'value' => $review->name,
                'note' => number_format((float) $review->rating, 1).' / 10',
            ];
        }

        return $moments;
    }

    /**
     * Where the year sits against everyone else's. Withheld entirely below
     * the population threshold — a percentile among five people is a fiction.
     *
     * @param  array<string,int>  $now
     */
    private function percentiles(User $user, int $year, array $now): array
    {
        [$start, $end] = $this->window($year);

        $population = (int) DB::table('user_games')
            ->whereBetween('updated_at', [$start, $end])
            ->distinct()
            ->count('user_id');

        if ($population < self::PERCENTILE_MIN_POPULATION) {
            return ['available' => false, 'population' => $population, 'items' => []];
        }

        $items = [];

        $completions = DB::table('user_games')
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start, $end])
            ->selectRaw('user_id, COUNT(*) as tally')
            ->groupBy('user_id')
            ->pluck('tally');

        if ($now['games_completed'] > 0) {
            $items[] = [
                'key' => 'completions',
                'label' => 'Completions',
                'percentile' => $this->topPercent($completions, $now['games_completed'], $population),
            ];
        }

        $achievements = DB::table('user_achievements')
            ->whereBetween('unlocked_at', [$start, $end])
            ->selectRaw('user_id, COUNT(*) as tally')
            ->groupBy('user_id')
            ->pluck('tally');

        if ($now['achievements'] > 0) {
            $items[] = [
                'key' => 'achievements',
                'label' => 'Achievements',
                'percentile' => $this->topPercent($achievements, $now['achievements'], $population),
            ];
        }

        $reviews = DB::table('game_ratings')
            ->where('is_draft', false)
            ->whereNotNull('review')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('user_id, COUNT(*) as tally')
            ->groupBy('user_id')
            ->pluck('tally');

        if ($now['reviews'] > 0) {
            $items[] = [
                'key' => 'reviews',
                'label' => 'Reviews written',
                'percentile' => $this->topPercent($reviews, $now['reviews'], $population),
            ];
        }

        $hours = DB::table('play_sessions')
            ->whereBetween('played_on', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('user_id, SUM(minutes) as tally')
            ->groupBy('user_id')
            ->pluck('tally');

        if ($now['hours'] > 0 && $hours->count() >= self::PERCENTILE_MIN_POPULATION) {
            $items[] = [
                'key' => 'hours',
                'label' => 'Hours played',
                'percentile' => $this->topPercent($hours, $now['hours'] * 60, $hours->count()),
            ];
        }

        return ['available' => $items !== [], 'population' => $population, 'items' => $items];
    }

    private function community(User $user, int $year, array $before): array
    {
        [$start, $end] = $this->window($year);

        $friends = (int) DB::table('friendships')
            ->where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->whereBetween('updated_at', [$start, $end])
            ->count();

        $comments = (int) DB::table('comments')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereBetween('created_at', [$start, $end])
            ->count();

        $posts = (int) DB::table('posts')
            ->where('author_id', $user->id)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        return [
            ['key' => 'friends', 'label' => 'Friends made', 'value' => $friends],
            ['key' => 'comments', 'label' => 'Comments posted', 'value' => $comments],
            ['key' => 'posts', 'label' => 'Forum posts', 'value' => $posts],
        ];
    }

    /**
     * Two words for the year, earned from what actually filled it — the same
     * philosophy as an archetype, not a fixed list per genre.
     */
    private function archetype(User $user, int $year): array
    {
        $dna = $this->dna($user, $year);
        $totals = $this->totals($user, $year);

        if (! $dna['genres']) {
            return ['name' => 'Year One', 'blurb' => 'The year the shelf started filling up.'];
        }

        $top = $dna['genres'][0]['name'];
        $played = max(1, $totals['games_played']);
        $finishRate = $totals['games_completed'] / $played;

        $noun = match (true) {
            str_contains($top, 'Role-playing') => 'Explorer',
            str_contains($top, 'Adventure') => 'Wanderer',
            str_contains($top, 'Strategy') => 'Strategist',
            str_contains($top, 'Action') => 'Frontliner',
            str_contains($top, 'Simulation') => 'Architect',
            str_contains($top, 'Puzzle') => 'Thinker',
            str_contains($top, 'Sports'), str_contains($top, 'Racing') => 'Competitor',
            default => 'Gamer',
        };

        $adjective = match (true) {
            $finishRate >= 0.5 => 'Relentless',
            $totals['reviews'] >= 5 => 'Story-Driven',
            $totals['streak'] >= 14 => 'Devoted',
            $totals['hours'] >= 300 => 'Immersed',
            default => 'Curious',
        };

        return [
            'name' => "{$adjective} {$noun}",
            'blurb' => match ($adjective) {
                'Relentless' => 'You finish what you start, and this year proves it.',
                'Story-Driven' => 'You dive deep into worlds and come back with something to say.',
                'Devoted' => 'You showed up, day after day.',
                'Immersed' => 'You gave this year real hours, not scraps.',
                default => 'You tried everything the year put in front of you.',
            },
        ];
    }

    /* ── helpers ──────────────────────────────────────────────────────── */

    /** @return array{0:Carbon,1:Carbon} */
    private function window(int $year): array
    {
        return [
            Carbon::create($year, 1, 1)->startOfDay(),
            Carbon::create($year, 12, 31)->endOfDay(),
        ];
    }

    /** "Top N%" — 1 is the best readout, never 0. */
    private function topPercent(Collection $values, int $mine, int $population): int
    {
        $below = $values->filter(fn ($v) => (int) $v < $mine)->count();

        return max(1, 100 - (int) round($below / max(1, $population) * 100));
    }

    /** The share of players holding an achievement, or null below threshold. */
    private function rarityOf(int $achievementId): ?string
    {
        $population = (int) DB::table('user_achievements')->distinct()->count('user_id');

        if ($population < 50) {
            return null;
        }

        $holders = (int) DB::table('user_achievements')->where('achievement_id', $achievementId)->distinct()->count('user_id');
        $percent = max(1, (int) round($holders / $population * 100));

        return " · {$percent}% of players";
    }

    private function hhmm(int $minutes): string
    {
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return $h === 0 ? "{$m}m" : ($m === 0 ? "{$h}h" : "{$h}h {$m}m");
    }

    /** @return string[] */
    private function genresOf(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        $trimmed = trim($raw, '{}');

        if ($trimmed === '') {
            return [];
        }

        return array_map(
            fn (string $part) => trim($part, ' "'),
            preg_split('/,(?=(?:[^"]*"[^"]*")*[^"]*$)/', $trimmed) ?: []
        );
    }
}
