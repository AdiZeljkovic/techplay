<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\GameList;
use App\Models\GameRating;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Gamer DNA — everything the profile can say about a player's taste, read
 * out of the collection they've built and the work they've done on the site.
 *
 * Every figure here is derived, never stored and never guessed. Where the
 * derivation is coarse (the taste axes lean on genre and tag vocabulary
 * rather than measured play), the payload carries the basis alongside the
 * number so the UI can say what it is looking at.
 */
class GamerDnaService
{
    /** Below this many scored profiles, a percentile is noise. */
    private const PERCENTILE_MIN_POPULATION = 50;

    /**
     * Moby's genre vocabulary, weighted along the three taste axes.
     * Each weight runs −1 (hard left label) to +1 (hard right label).
     *
     * @var array<string,array{0:float,1:float,2:float}> [solo↔multi, competitive↔relaxed, story↔systems]
     */
    private const GENRE_WEIGHTS = [
        'Action' => [0.2, -0.4, -0.1],
        'Adventure' => [-0.9, 0.8, -0.9],
        'Role-playing (RPG)' => [-0.5, 0.2, -0.6],
        'Strategy / tactics' => [0.1, -0.3, 0.9],
        'Simulation' => [-0.2, 0.6, 0.8],
        'Puzzle' => [-0.6, 0.5, 0.6],
        'Sports' => [0.8, -0.8, 0.5],
        'Racing / Driving' => [0.5, -0.6, 0.3],
        'Educational' => [-0.7, 0.7, 0.4],
        'Gambling' => [0.6, -0.2, 0.7],
        'Idle' => [-0.6, 0.9, 0.7],
    ];

    /**
     * Tags sharpen what the genre only hints at — "Visual novel" and
     * "Managerial / business simulation" are both Simulation to Moby.
     *
     * @var array<string,array{0:float,1:float,2:float}>
     */
    private const TAG_WEIGHTS = [
        'Visual novel' => [-1.0, 0.9, -1.0],
        'Interactive fiction / text adventure' => [-1.0, 0.8, -1.0],
        'Graphic adventure' => [-0.9, 0.7, -0.7],
        'Story / mission' => [-0.4, 0.2, -0.8],
        'Detective / mystery' => [-0.7, 0.4, -0.6],
        'Managerial / business simulation' => [-0.3, 0.3, 0.9],
        'Text-based / Spreadsheet' => [-0.5, 0.4, 0.8],
        'Turn-based' => [0.0, 0.3, 0.4],
        'Board game' => [0.7, -0.2, 0.7],
        'Cards / tiles' => [0.4, 0.2, 0.6],
        'Tile matching puzzle' => [-0.5, 0.6, 0.6],
        'Fighting' => [0.8, -0.9, 0.2],
        'Shooter' => [0.4, -0.5, -0.1],
        'Track racing' => [0.4, -0.7, 0.3],
        'Arcade' => [0.2, -0.3, 0.1],
        'Horror' => [-0.6, 0.1, -0.5],
        'Action RPG' => [-0.2, -0.1, -0.4],
    ];

    /** Release-year buckets, in the order they're drawn. */
    private const ERAS = [
        ['key' => 'retro', 'label' => 'Retro', 'range' => 'Pre-2000', 'from' => 0, 'to' => 1999, 'color' => '#a78bfa'],
        ['key' => 'ps2', 'label' => 'PS2 Era', 'range' => '2000–2006', 'from' => 2000, 'to' => 2006, 'color' => '#60a5fa'],
        ['key' => 'ps3', 'label' => 'PS3 / 360', 'range' => '2007–2012', 'from' => 2007, 'to' => 2012, 'color' => '#22d3ee'],
        ['key' => 'ps4', 'label' => 'PS4 / X1', 'range' => '2013–2020', 'from' => 2013, 'to' => 2020, 'color' => '#34d399'],
        ['key' => 'ps5', 'label' => 'PS5 / XSX', 'range' => '2020+', 'from' => 2021, 'to' => 9999, 'color' => '#f97316'],
    ];

    /** Score tiers, low to high — the suffix on the DNA rank. */
    private const TIERS = [
        [0, 'Novice'], [2000, 'Adept'], [4000, 'Veteran'], [6000, 'Elite'], [8000, 'Prime'],
    ];

    public function build(User $user): array
    {
        $entries = UserGame::where('user_id', $user->id)
            ->with(['game:id,name,slug,released,genre_names,tag_names,background_image'])
            ->get();

        $games = $entries->pluck('game')->filter();

        $counts = [
            'total' => $entries->count(),
            'playing' => $entries->where('status', 'playing')->count(),
            'completed' => $entries->where('status', 'completed')->count(),
            'backlog' => $entries->where('status', 'backlog')->count(),
            'wishlist' => $entries->where('status', 'wishlist')->count(),
            'dropped' => $entries->where('status', 'dropped')->count(),
            'favorites' => $entries->where('is_favorite', true)->count(),
        ];

        // Owned = everything the player actually has, wishlist excluded. It's
        // the denominator for completion; a wishlist can't be finished.
        $owned = $counts['playing'] + $counts['completed'] + $counts['backlog'] + $counts['dropped'];
        $completionRate = $owned > 0 ? $counts['completed'] / $owned : 0.0;

        $genres = $this->distribution($games, 'genre_names', 8);
        $platforms = $this->platformSplit($entries);
        $eras = $this->eras($games);
        $fingerprint = $this->fingerprint($games, $completionRate, $owned);

        $reviews = GameRating::where('user_id', $user->id)->where('is_draft', false)->whereNotNull('review')->count();
        $lists = GameList::where('user_id', $user->id)->count();
        $achievementsTotal = Achievement::where('is_hidden', false)->count();
        $achievementsOwned = $user->achievements()->count();

        $score = $this->score($user, $counts, $completionRate, $reviews, $lists, $achievementsOwned, $achievementsTotal);
        $identity = $this->identity($fingerprint, $counts, $genres, $completionRate, $reviews, $user);

        return [
            'identity' => $identity + ['tier' => $this->tier($score['value'])],
            'score' => $score + ['percentile' => $this->percentile($user, $score['value'])],
            'genres' => $genres,
            'platforms' => $platforms,
            'eras' => $eras,
            'fingerprint' => $fingerprint,
            'collection' => $counts + ['completion_rate' => (int) round($completionRate * 100)],
            'contribution' => $this->contribution($user, $counts),
            'badges' => $this->badges($user),
            'setup' => $this->setup($user),
            'archetypes' => $this->archetypes($user, $entries, $games, $counts, $achievementsOwned, $reviews, $genres),
            'updated_at' => now()->toIso8601String(),
        ];
    }

    /* ── taste ─────────────────────────────────────────────────────────── */

    /**
     * The five axes. The first three read taste out of the genre and tag
     * vocabulary; the last two are measured directly off the collection.
     */
    private function fingerprint(Collection $games, float $completionRate, int $owned): array
    {
        [$solo, $comp, $story, $weighted] = $this->tasteAxes($games);

        $basis = $weighted > 0
            ? $weighted.' '.($weighted === 1 ? 'game' : 'games').' by genre'
            : 'Not enough games yet';

        $years = $games->pluck('released')->filter()->map(fn ($d) => (int) substr((string) $d, 0, 4))->filter(fn ($y) => $y > 1950);
        $avgYear = $years->isNotEmpty() ? $years->avg() : null;

        return [
            [
                'key' => 'social', 'left' => 'Solo', 'right' => 'Multiplayer',
                'value' => $solo, 'basis' => $basis, 'measured' => false,
            ],
            [
                'key' => 'intensity', 'left' => 'Competitive', 'right' => 'Relaxed',
                'value' => $comp, 'basis' => $basis, 'measured' => false,
            ],
            [
                'key' => 'focus', 'left' => 'Story', 'right' => 'Systems',
                'value' => $story, 'basis' => $basis, 'measured' => false,
            ],
            [
                'key' => 'finishing', 'left' => 'Exploration', 'right' => 'Completion',
                'value' => (int) round($completionRate * 100),
                'basis' => $owned > 0 ? "Finished {$this->finished($completionRate, $owned)} of {$owned} owned" : 'No owned games yet',
                'measured' => true,
            ],
            [
                'key' => 'era', 'left' => 'Retro', 'right' => 'Modern',
                // 1985 reads as pure retro, 2025 as pure modern.
                'value' => $avgYear === null ? 50 : max(0, min(100, (int) round((($avgYear - 1985) / 40) * 100))),
                'basis' => $avgYear === null ? 'No release dates yet' : 'Average release '.(int) round($avgYear),
                'measured' => true,
            ],
        ];
    }

    private function finished(float $rate, int $owned): int
    {
        return (int) round($rate * $owned);
    }

    /**
     * Weighted average of every genre and tag the collection carries,
     * mapped from −1…+1 onto 0…100.
     *
     * @return array{0:int,1:int,2:int,3:int} [solo, competitive, story, games counted]
     */
    private function tasteAxes(Collection $games): array
    {
        $sums = [0.0, 0.0, 0.0];
        $weights = [0.0, 0.0, 0.0];
        $counted = 0;

        foreach ($games as $game) {
            $hit = false;

            foreach ((array) ($game->genre_names ?? []) as $name) {
                if (! isset(self::GENRE_WEIGHTS[$name])) {
                    continue;
                }
                foreach (self::GENRE_WEIGHTS[$name] as $i => $w) {
                    $sums[$i] += $w;
                    $weights[$i] += abs($w);
                }
                $hit = true;
            }

            // Tags carry half a genre's pull — they refine, they don't decide.
            foreach ((array) ($game->tag_names ?? []) as $name) {
                if (! isset(self::TAG_WEIGHTS[$name])) {
                    continue;
                }
                foreach (self::TAG_WEIGHTS[$name] as $i => $w) {
                    $sums[$i] += $w * 0.5;
                    $weights[$i] += abs($w) * 0.5;
                }
                $hit = true;
            }

            if ($hit) {
                $counted++;
            }
        }

        $axis = function (int $i) use ($sums, $weights): int {
            if ($weights[$i] <= 0.0) {
                return 50;
            }

            return max(0, min(100, (int) round((($sums[$i] / $weights[$i]) + 1) / 2 * 100)));
        };

        return [$axis(0), $axis(1), $axis(2), $counted];
    }

    /* ── distributions ─────────────────────────────────────────────────── */

    /**
     * Share of the collection per value of a Postgres TEXT[] column.
     */
    private function distribution(Collection $games, string $column, int $limit): array
    {
        $tally = [];

        foreach ($games as $game) {
            foreach ((array) ($game->{$column} ?? []) as $name) {
                // Packaging labels are not genres.
                if (in_array($name, ['Add-on', 'Compilation', 'Special edition'], true)) {
                    continue;
                }
                $tally[$name] = ($tally[$name] ?? 0) + 1;
            }
        }

        arsort($tally);
        $total = array_sum($tally);

        return collect($tally)->take($limit)
            ->map(fn ($count, $name) => [
                'name' => $name,
                'count' => $count,
                'percent' => $total > 0 ? (int) round($count / $total * 100) : 0,
            ])->values()->all();
    }

    /**
     * Platform affinity from the platform tagged on each collection entry —
     * where the player actually keeps the game, not where it shipped.
     */
    private function platformSplit(Collection $entries): array
    {
        $tally = $entries->pluck('platform')->filter()->countBy()->sortDesc();
        $total = $tally->sum();

        return $tally->take(6)
            ->map(fn ($count, $name) => [
                'name' => $name,
                'count' => $count,
                'percent' => $total > 0 ? (int) round($count / $total * 100) : 0,
            ])->values()->all();
    }

    private function eras(Collection $games): array
    {
        $years = $games->pluck('released')->filter()
            ->map(fn ($d) => (int) substr((string) $d, 0, 4))
            ->filter(fn ($y) => $y > 1950);

        $total = $years->count();

        return collect(self::ERAS)->map(function (array $era) use ($years, $total) {
            $count = $years->filter(fn ($y) => $y >= $era['from'] && $y <= $era['to'])->count();

            return [
                'key' => $era['key'],
                'label' => $era['label'],
                'range' => $era['range'],
                'color' => $era['color'],
                'count' => $count,
                'percent' => $total > 0 ? (int) round($count / $total * 100) : 0,
            ];
        })->all();
    }

    /* ── score & identity ──────────────────────────────────────────────── */

    /**
     * Five components worth 2000 each. Deliberately legible: the breakdown
     * ships with the total so the page can show its working.
     */
    private function score(
        User $user, array $counts, float $completionRate,
        int $reviews, int $lists, int $achievementsOwned, int $achievementsTotal
    ): array {
        $cap = fn (float $v) => (int) round(max(0, min(2000, $v)));

        $collection = $cap(min($counts['total'] / 200, 1) * 2000);
        $completion = $cap($completionRate * 2000);
        $curation = $cap($reviews * 120 + $counts['favorites'] * 25 + $lists * 150);
        $community = $cap(
            $user->posts()->count() * 15
            + $user->threads()->count() * 40
            + ($user->forum_reputation ?? 0) * 2
        );
        $progression = $cap(
            ($achievementsTotal > 0 ? $achievementsOwned / $achievementsTotal : 0) * 1200
            + min(app(LevelService::class)->forXp($user->xp) / 50, 1) * 800
        );

        $breakdown = [
            ['key' => 'collection', 'label' => 'Collection', 'value' => $collection],
            ['key' => 'completion', 'label' => 'Completion', 'value' => $completion],
            ['key' => 'curation', 'label' => 'Curation', 'value' => $curation],
            ['key' => 'community', 'label' => 'Community', 'value' => $community],
            ['key' => 'progression', 'label' => 'Progression', 'value' => $progression],
        ];

        return [
            'value' => array_sum(array_column($breakdown, 'value')),
            'max' => 10000,
            'component_max' => 2000,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Three words for a player. Every candidate carries how strongly it
     * applies, and the three strongest win — so the label moves as the
     * collection does instead of settling on the same generic trio.
     */
    private function identity(array $fingerprint, array $counts, array $genres, float $completionRate, int $reviews, User $user): array
    {
        $axis = fn (string $key) => collect($fingerprint)->firstWhere('key', $key)['value'] ?? 50;

        $candidates = [
            ['Completionist', $completionRate * 100, 'you leave nothing unfinished'],
            ['Explorer', count($genres) >= 6 ? 60 + count($genres) * 3 : count($genres) * 8, 'you try everything that lands in front of you'],
            ['Story-Driven', 100 - $axis('focus'), 'you play for the story first'],
            ['Systems Thinker', $axis('focus'), 'you want to know how the machine underneath works'],
            ['Social Player', $axis('social'), 'you are at your best in company'],
            ['Lone Wolf', 100 - $axis('social'), 'you would rather play alone'],
            ['Competitor', 100 - $axis('intensity'), 'you play to win'],
            ['Chill Player', $axis('intensity'), 'you play to unwind'],
            ['Retro Soul', 100 - $axis('era'), 'the older titles still suit you best'],
            ['Collector', $counts['total'] >= 50 ? min(100, $counts['total'] / 2) : $counts['total'], 'your shelf grows faster than you can play it'],
            ['Critic', min(100, $reviews * 18), 'you have an opinion, not just a save file'],
            ['Community Pillar', min(100, ($user->forum_reputation ?? 0) / 5), 'the forum would not be the same without you'],
        ];

        usort($candidates, fn ($a, $b) => $b[1] <=> $a[1]);
        $top = array_slice($candidates, 0, 3);

        return [
            'traits' => array_column($top, 0),
            'blurb' => $counts['total'] === 0
                ? 'Add a few games to your collection and your DNA starts to take shape.'
                : ucfirst($top[0][2]).', '.$top[1][2].' i '.$top[2][2].'.',
        ];
    }

    private function tier(int $score): string
    {
        $label = 'Novice';
        foreach (self::TIERS as [$floor, $name]) {
            if ($score >= $floor) {
                $label = $name;
            }
        }

        return $label;
    }

    /**
     * Where this score sits against everyone else's. Null until enough
     * profiles carry a score for the figure to mean anything.
     */
    private function percentile(User $user, int $score): ?int
    {
        if ($user->dna_score !== $score) {
            $user->forceFill(['dna_score' => $score])->saveQuietly();
        }

        $population = User::whereNotNull('dna_score')->count();

        if ($population < self::PERCENTILE_MIN_POPULATION) {
            return null;
        }

        $below = User::whereNotNull('dna_score')->where('dna_score', '<', $score)->count();

        // "Top N%" — 1 is the best possible readout, never 0.
        return max(1, 100 - (int) round($below / $population * 100));
    }

    /* ── the rest of the page ──────────────────────────────────────────── */

    private function contribution(User $user, array $counts): array
    {
        $row = fn (string $label, int $value, int $target) => [
            'label' => $label, 'value' => $value, 'target' => $target,
            'percent' => $target > 0 ? min(100, (int) round($value / $target * 100)) : 0,
        ];

        return [
            $row('Forum Posts', $user->posts()->count(), 100),
            $row('Discussions Started', $user->threads()->count(), 25),
            $row('Games on Wishlist', $counts['wishlist'], 100),
            $row('Reputation Earned', (int) ($user->forum_reputation ?? 0), 2000),
        ];
    }

    private function badges(User $user): array
    {
        $owned = $user->achievements()->orderByDesc('points')->get();

        return [
            'items' => $owned->take(4)->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'icon_path' => $a->versionedIconPath(),
                'points' => (int) $a->points,
            ])->values()->all(),
            'more' => max(0, $owned->count() - 4),
        ];
    }

    /**
     * The rig, as the player typed it, plus a coarse tier read off the GPU
     * string. The tier is a hint, not a benchmark — it says so in the label.
     */
    private function setup(User $user): array
    {
        $specs = array_filter((array) ($user->pc_specs ?? []));
        $gpu = (string) ($specs['gpu'] ?? '');

        $tier = null;
        if ($gpu !== '') {
            $tier = match (true) {
                (bool) preg_match('/\b(RTX\s*(50|40)(80|90)|RX\s*(79|89|99)\d{2})/i', $gpu) => ['label' => 'Enthusiast', 'level' => 4, 'note' => 'Built for 4K'],
                (bool) preg_match('/\b(RTX\s*(30|40|50)[5-8]0|RX\s*(67|68|77|78)\d{2})/i', $gpu) => ['label' => 'High-End', 'level' => 3, 'note' => 'Great for 1440p'],
                (bool) preg_match('/\b(RTX\s*(20|30|40)[5-6]0|GTX\s*16\d{2}|RX\s*(56|66)\d{2})/i', $gpu) => ['label' => 'Mid-Range', 'level' => 2, 'note' => 'Solid at 1080p'],
                default => ['label' => 'Entry', 'level' => 1, 'note' => 'Runs the classics'],
            };
        }

        return [
            'specs' => $specs,
            'tier' => $tier,
            // The handles used to live in their own card on the old Stats tab;
            // they belong next to the rig, not in a card of their own.
            'gamertags' => array_filter((array) ($user->gamertags ?? [])),
        ];
    }

    /**
     * Archetypes are a second, softer ladder: each is one number the player
     * already produces, banded into five levels. Derived on read — nothing
     * is stored, so a changed collection changes the badge immediately.
     */
    private function archetypes(
        User $user, Collection $entries, Collection $games,
        array $counts, int $achievementsOwned, int $reviews, array $genres
    ): array {
        $storyGames = $games->filter(function ($game) {
            $names = array_merge((array) ($game->genre_names ?? []), (array) ($game->tag_names ?? []));

            return (bool) array_intersect($names, ['Role-playing (RPG)', 'Adventure', 'Visual novel', 'Story / mission', 'Graphic adventure']);
        })->count();

        $rows = [
            ['key' => 'lore_hunter', 'name' => 'Lore Hunter', 'icon' => 'book', 'value' => $storyGames, 'steps' => [3, 10, 25, 50, 100], 'unit' => 'story-driven games'],
            ['key' => 'backlog_tactician', 'name' => 'Backlog Tactician', 'icon' => 'chess', 'value' => $entries->where('status', 'completed')->where('from_backlog', true)->count(), 'steps' => [1, 5, 15, 30, 60], 'unit' => 'backlog games finished'],
            ['key' => 'achievement_chaser', 'name' => 'Achievement Chaser', 'icon' => 'trophy', 'value' => $achievementsOwned, 'steps' => [3, 10, 20, 35, 50], 'unit' => 'achievements unlocked'],
            ['key' => 'night_owl', 'name' => 'Night Owl', 'icon' => 'moon', 'value' => $this->nightShare($user), 'steps' => [10, 25, 40, 55, 70], 'unit' => '% of activity after midnight'],
            ['key' => 'genre_nomad', 'name' => 'Genre Nomad', 'icon' => 'compass', 'value' => count($genres), 'steps' => [2, 4, 6, 8, 10], 'unit' => 'genres in the collection'],
            ['key' => 'curator', 'name' => 'Curator', 'icon' => 'quill', 'value' => $reviews + $counts['favorites'], 'steps' => [3, 8, 20, 40, 80], 'unit' => 'reviews and favourites'],
        ];

        $out = collect($rows)->map(function (array $row) {
            $level = 0;
            foreach ($row['steps'] as $i => $step) {
                if ($row['value'] >= $step) {
                    $level = $i + 1;
                }
            }

            $next = $row['steps'][$level] ?? null;

            return [
                'key' => $row['key'],
                'name' => $row['name'],
                'icon' => $row['icon'],
                'level' => $level,
                'max_level' => count($row['steps']),
                'value' => $row['value'],
                'next_at' => $next,
                'percent' => $next ? min(100, (int) round($row['value'] / $next * 100)) : 100,
                'hint' => $next
                    ? ($next - $row['value']).' more '.$row['unit'].' for level '.($level + 1)
                    : 'Maxed — '.$row['value'].' '.$row['unit'],
            ];
        })->sortByDesc('level')->values();

        return $out->take(4)->all();
    }

    /**
     * Share of recent forum and comment activity posted between midnight and
     * 5am. Read in PHP rather than SQL so it behaves the same on Postgres
     * and on the sqlite the tests run against.
     */
    private function nightShare(User $user): int
    {
        $times = $user->comments()->latest()->limit(250)->pluck('created_at')
            ->merge($user->posts()->latest()->limit(250)->pluck('created_at'))
            ->filter();

        if ($times->count() < 5) {
            return 0;
        }

        $night = $times->filter(function ($t) {
            $hour = (int) Carbon::parse($t)->format('G');

            return $hour >= 0 && $hour < 5;
        })->count();

        return (int) round($night / $times->count() * 100);
    }
}
