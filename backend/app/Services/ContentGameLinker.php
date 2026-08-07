<?php

namespace App\Services;

use App\Models\Game;

/**
 * Finds which game a piece of content is about, so the game page can
 * collect everything written about a title and the article page can show
 * the title it covers. One linker for articles, reviews and guides.
 *
 * Two signals, in order of trust:
 *
 *  1. review_data.game_title — the editor picked the game by hand in the
 *     review form. Exact normalized match, no guessing.
 *  2. The headline. A catalogue name found inside it on word boundaries,
 *     longest match winning, so "The Witcher 3: Wild Hunt review" links
 *     the game and not "The Witcher".
 *
 * The rules that keep it honest, all learned from the first dry run:
 *
 *  - Only notable games may claim anything (rated, viewed, or
 *    aggregator-tracked — 139k rows contain a game literally named "News").
 *  - Headlines are scanned for MULTI-word names only. Single-word titles
 *    are real games ("Limbo", "Control", "Scorn") but they are also
 *    English — "development limbo" and "Samsung Galaxy" must not link.
 *    Reviews still link their single-word games through the declared title.
 *  - A name followed by a digit is a sequel we may not have: "The
 *    Witcher 4" must not link The Witcher (2007).
 *  - When one name means several games (Silent Hill 2, 2001 and its 2024
 *    remake), the content's publish year picks the closest release.
 */
class ContentGameLinker
{
    /** @var array<string,array<int,array{id:int,year:?int}>>|null comparable name → claimants */
    private ?array $index = null;

    /**
     * The game a piece of content is about, or null.
     *
     * @param  string|null  $declaredTitle  review_data.game_title when present
     * @param  int|null  $contentYear  publish year, for picking among remakes
     */
    public function match(?string $declaredTitle, string $headline, ?int $contentYear = null): ?int
    {
        $index = $this->index();

        // Signal 1: the hand-picked title, matched whole — single words allowed,
        // an editor typed this on purpose.
        if ($declaredTitle) {
            $claimants = $index[$this->comparable($declaredTitle)] ?? [];
            if ($claimants !== []) {
                return $this->closest($claimants, $contentYear);
            }
        }

        // Signal 2: the longest multi-word catalogue name inside the headline.
        $haystack = ' '.$this->comparable($headline).' ';
        $best = null;
        $bestLength = 0;

        foreach ($index as $name => $claimants) {
            if (mb_strlen($name) <= $bestLength || ! str_contains($name, ' ')) {
                continue;
            }

            $pos = mb_strpos($haystack, ' '.$name.' ');
            if ($pos === false) {
                continue;
            }

            // The sequel guard: "the witcher 4" contains "the witcher", but
            // the digit after it names a game this match is not.
            $after = mb_substr($haystack, $pos + mb_strlen(' '.$name.' '), 3);
            if (preg_match('/^\d/', ltrim($after))) {
                continue;
            }

            $best = $this->closest($claimants, $contentYear);
            $bestLength = mb_strlen($name);
        }

        return $best;
    }

    /** Among same-named games, the one released nearest the content's year. */
    private function closest(array $claimants, ?int $contentYear): int
    {
        if (count($claimants) === 1 || $contentYear === null) {
            return $claimants[0]['id'];
        }

        return collect($claimants)
            ->sortBy(fn ($c) => $c['year'] === null ? PHP_INT_MAX : abs($c['year'] - $contentYear))
            ->first()['id'];
    }

    /**
     * Notable games only: something people rate, view, or that the release
     * aggregator tracks. An obscure 1983 row named "Word" must never claim
     * a headline.
     */
    private function index(): array
    {
        if ($this->index !== null) {
            return $this->index;
        }

        $this->index = [];

        Game::query()
            ->select(['id', 'name', 'released'])
            ->where(fn ($q) => $q->where('rating', '>', 0)
                ->orWhere('views', '>', 0)
                ->orWhereNotNull('match_key'))
            ->orderBy('id')
            ->chunk(5000, function ($games) {
                foreach ($games as $game) {
                    $key = $this->comparable($game->name);
                    if (mb_strlen($key) < 4) {
                        continue;
                    }
                    $this->index[$key][] = [
                        'id' => $game->id,
                        'year' => $game->released?->year,
                    ];
                }
            });

        return $this->index;
    }

    /** Same reduction the OpenCritic matcher trusts: roman numerals as digits. */
    public function comparable(string $name): string
    {
        $romans = ['x' => '10', 'ix' => '9', 'viii' => '8', 'vii' => '7', 'vi' => '6',
            'v' => '5', 'iv' => '4', 'iii' => '3', 'ii' => '2'];

        $s = mb_strtolower(trim($name));
        $s = (string) preg_replace('/[^\p{L}\p{N} ]+/u', ' ', $s);
        $s = (string) preg_replace_callback(
            '/\b(x|ix|viii|vii|vi|v|iv|iii|ii)\b/',
            fn ($m) => $romans[$m[1]],
            $s
        );

        return trim((string) preg_replace('/\s+/', ' ', $s));
    }

    /** The linked game as the content payload carries it — one shape everywhere. */
    public static function gamePayload(?Game $game): ?array
    {
        if (! $game) {
            return null;
        }

        return [
            'slug' => $game->slug,
            'name' => $game->name,
            'cover_url' => $game->cover_url,
            'released' => $game->released?->toDateString(),
            'rating' => $game->rating !== null ? (float) $game->rating : null,
            'genres' => array_slice((array) ($game->genres ?? []), 0, 3),
            'platforms' => array_slice((array) ($game->platforms ?? []), 0, 4),
            'critic_scores' => $game->critic_scores,
        ];
    }
}
