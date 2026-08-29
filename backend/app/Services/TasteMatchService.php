<?php

namespace App\Services;

use App\Casts\PostgresArray;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;

/**
 * How much two readers' taste in games actually overlaps.
 *
 * The profile could tell you everything about one person and nothing about how
 * they relate to you, which is the only question a stranger's analytics page
 * really answers. This is the reason to open somebody else's Insights — and the
 * most natural moment there has ever been to send a friend request.
 *
 * Three signals, weighted by how much they say:
 *
 *   genres    50% — what you reach for. The strongest signal by far: two people
 *                   with no game in common can still both live on CRPGs.
 *   library   30% — what you own. Direct but blunt; big libraries overlap by
 *                   accident and small ones cannot overlap at all.
 *   platforms 20% — where you play. Weak on its own, but it separates two
 *                   otherwise identical shooters fans on PC and Switch.
 *
 * The weights are stated rather than tuned into a black box, because a match
 * percentage nobody can explain is a horoscope.
 */
class TasteMatchService
{
    /**
     * Below this many games, a percentage is noise dressed as a measurement.
     *
     * Two people who each own two games and share one are not "50% matched" in
     * any sense worth printing.
     */
    public const MIN_LIBRARY = 3;

    private const WEIGHTS = ['genres' => 0.5, 'library' => 0.3, 'platforms' => 0.2];

    public function between(User $viewer, User $target): array
    {
        if ($viewer->id === $target->id) {
            return ['comparable' => false, 'reason' => 'self'];
        }

        $mine = $this->libraryOf($viewer->id);
        $theirs = $this->libraryOf($target->id);

        if (count($mine['games']) < self::MIN_LIBRARY || count($theirs['games']) < self::MIN_LIBRARY) {
            return [
                'comparable' => false,
                'reason' => 'too_small',
                'needed' => self::MIN_LIBRARY,
                // Which side is short, so the page can say the useful thing
                // rather than a shrug that fits both cases.
                'yours_is_short' => count($mine['games']) < self::MIN_LIBRARY,
            ];
        }

        $genreScore = $this->cosine($mine['genres'], $theirs['genres']);
        $sharedGames = array_values(array_intersect($mine['games'], $theirs['games']));
        $libraryScore = $this->jaccard($mine['games'], $theirs['games']);
        $platformScore = $this->cosine($mine['platforms'], $theirs['platforms']);

        $score = (int) round(
            ($genreScore * self::WEIGHTS['genres']
                + $libraryScore * self::WEIGHTS['library']
                + $platformScore * self::WEIGHTS['platforms']) * 100
        );

        return [
            'comparable' => true,
            'score' => $score,
            'verdict' => $this->verdict($score),
            'breakdown' => [
                ['key' => 'genres', 'label' => 'Taste in genres', 'percent' => (int) round($genreScore * 100)],
                ['key' => 'library', 'label' => 'Games in common', 'percent' => (int) round($libraryScore * 100)],
                ['key' => 'platforms', 'label' => 'Where you play', 'percent' => (int) round($platformScore * 100)],
            ],
            'shared_games' => $this->presentGames($sharedGames),
            'shared_genres' => $this->topShared($mine['genres'], $theirs['genres']),
            // What one of you is into and the other is not. The disagreement is
            // more interesting than the agreement, and it is what people
            // actually reply to.
            'they_love' => $this->topShared($theirs['genres'], $mine['genres'], true),
            'you_love' => $this->topShared($mine['genres'], $theirs['genres'], true),
            'counts' => ['yours' => count($mine['games']), 'theirs' => count($theirs['games']), 'shared' => count($sharedGames)],
        ];
    }

    /* ── the data ─────────────────────────────────────────────────────── */

    /**
     * One pass per reader: the game ids they hold, and how often each genre
     * and platform appears across them.
     *
     * @return array{games:array<int,int>, genres:array<string,int>, platforms:array<string,int>}
     */
    private function libraryOf(int $userId): array
    {
        // Wishlist is intent, not taste — somebody's wishlist is who they would
        // like to be. The shelf is who they are.
        $rows = UserGame::where('user_id', $userId)
            ->whereIn('status', ['playing', 'completed', 'backlog', 'dropped'])
            ->pluck('game_id')
            ->all();

        if ($rows === []) {
            return ['games' => [], 'genres' => [], 'platforms' => []];
        }

        $genres = [];
        $platforms = [];

        Game::whereIn('id', $rows)
            ->select(['id', 'genres', 'platforms'])
            ->chunk(500, function ($games) use (&$genres, &$platforms) {
                foreach ($games as $game) {
                    foreach ($this->names($game->genres) as $name) {
                        $genres[$name] = ($genres[$name] ?? 0) + 1;
                    }
                    foreach ($this->names($game->platforms) as $name) {
                        $platforms[$name] = ($platforms[$name] ?? 0) + 1;
                    }
                }
            });

        return ['games' => $rows, 'genres' => $genres, 'platforms' => $platforms];
    }

    /**
     * Postgres hands array columns back as a raw string through PDO often
     * enough that every caller in this codebase has to be ready for both.
     */
    private function names(mixed $value): array
    {
        if (is_array($value)) {
            return array_filter(array_map('trim', $value));
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        // Split here on every comma, so 454 platform values and 353 tags —
        // anything with one inside — entered the taste vector as fragments.
        return array_filter(array_map('trim', PostgresArray::parse($value)));
    }

    /* ── the maths ────────────────────────────────────────────────────── */

    /**
     * Cosine similarity over two tallies.
     *
     * Chosen over a plain overlap count because it compares *shape* rather than
     * size: somebody with forty RPGs and somebody with four are pointed the
     * same way, and a raw count would call them strangers.
     */
    private function cosine(array $a, array $b): float
    {
        if ($a === [] || $b === []) {
            return 0.0;
        }

        $dot = 0.0;
        foreach ($a as $key => $count) {
            if (isset($b[$key])) {
                $dot += $count * $b[$key];
            }
        }

        if ($dot === 0.0) {
            return 0.0;
        }

        $magA = sqrt(array_sum(array_map(fn ($n) => $n ** 2, $a)));
        $magB = sqrt(array_sum(array_map(fn ($n) => $n ** 2, $b)));

        return $magA > 0 && $magB > 0 ? min(1.0, $dot / ($magA * $magB)) : 0.0;
    }

    /** Shared over combined — brutal on purpose; owning the same game is rare. */
    private function jaccard(array $a, array $b): float
    {
        $union = count(array_unique(array_merge($a, $b)));

        return $union > 0 ? count(array_intersect($a, $b)) / $union : 0.0;
    }

    /**
     * @param  bool  $exclusive  true = what the first side has that the second does not
     */
    private function topShared(array $a, array $b, bool $exclusive = false, int $limit = 4): array
    {
        $picked = [];

        foreach ($a as $name => $count) {
            $hasOther = isset($b[$name]);

            if ($exclusive ? $hasOther : ! $hasOther) {
                continue;
            }

            // Shared: rank on the weaker side, so a genre one of you barely
            // touches cannot lead the list.
            $picked[$name] = $exclusive ? $count : min($count, $b[$name]);
        }

        arsort($picked);

        return array_map(
            fn ($name) => ['name' => $name, 'count' => $picked[$name]],
            array_slice(array_keys($picked), 0, $limit),
        );
    }

    private function presentGames(array $ids, int $limit = 6): array
    {
        if ($ids === []) {
            return [];
        }

        return Game::whereIn('id', array_slice($ids, 0, 60))
            ->orderByDesc('rating')
            ->limit($limit)
            ->get(['slug', 'name', 'cover_url'])
            ->map(fn (Game $g) => ['slug' => $g->slug, 'name' => $g->name, 'cover_url' => $g->cover_url])
            ->all();
    }

    /** A sentence beats a bare number, and people quote sentences. */
    private function verdict(int $score): string
    {
        return match (true) {
            $score >= 75 => 'Same wavelength',
            $score >= 55 => 'Plenty in common',
            $score >= 35 => 'Some overlap',
            $score >= 15 => 'Different tastes',
            default => 'Opposites',
        };
    }
}
