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
 *  - Where two games answer to one name, a rated or aggregator-tracked row
 *    goes first. This was an exclusion once — "only notable games may claim
 *    anything" — resting on `views > 0`, which by August meant "a crawler has
 *    opened this page" and was true of 303,399 rows out of 332,455.
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
    /**
     * The longest phrase a headline is worth checking.
     *
     * Real titles run long — "The Legend of Zelda: Tears of the Kingdom" is
     * eight words — but past a dozen the phrases are sentences, and every one
     * costs a slot in the lookup.
     */
    private const MAX_PHRASE_WORDS = 12;

    /**
     * The game a piece of content is about, or null.
     *
     * This used to build an index of the whole catalogue in memory and then
     * walk all of it for one headline. At 304,612 notable rows that exhausted
     * PHP's 128 MB and took the save down with it — authors could not publish
     * at all, and the error surfaced far from its cause, so the publish date
     * on the form got the blame.
     *
     * The question is asked the other way round now. A headline holds a few
     * dozen possible phrases; those are looked up on an index. Nothing here
     * grows with the size of the catalogue.
     *
     * @param  string|null  $declaredTitle  review_data.game_title when present
     * @param  int|null  $contentYear  publish year, for picking among remakes
     */
    public function match(?string $declaredTitle, string $headline, ?int $contentYear = null): ?int
    {
        // Signal 1: the hand-picked title, matched whole — single words allowed,
        // an editor typed this on purpose.
        if ($declaredTitle) {
            $key = $this->comparable($declaredTitle);

            if (mb_strlen($key) >= 4) {
                $claimants = $this->claimants([$key]);

                if ($claimants !== []) {
                    return $this->closest(array_values($claimants)[0], $contentYear);
                }
            }
        }

        // Signal 2: the longest multi-word catalogue name inside the headline.
        $words = array_values(array_filter(explode(' ', $this->comparable($headline))));

        if (count($words) < 2) {
            return null;
        }

        $phrases = $this->phrases($words);

        if ($phrases === []) {
            return null;
        }

        $claimants = $this->claimants(array_keys($phrases));

        // Longest first: "the witcher 3 wild hunt" must win over "the witcher".
        foreach ($phrases as $phrase => $endsAt) {
            if (! isset($claimants[$phrase])) {
                continue;
            }

            // The sequel guard: "the witcher 4" contains "the witcher", but the
            // digit after it names a game this match is not.
            if (isset($words[$endsAt + 1]) && preg_match('/^\d/', $words[$endsAt + 1])) {
                continue;
            }

            return $this->closest($claimants[$phrase], $contentYear);
        }

        return null;
    }

    /**
     * Every multi-word phrase in a headline, longest first.
     *
     * The value is the index of the phrase's last word, which is all the
     * sequel guard needs to see what follows it.
     *
     * @param  array<int,string>  $words
     * @return array<string,int>
     */
    private function phrases(array $words): array
    {
        $found = [];
        $count = count($words);

        for ($length = min($count, self::MAX_PHRASE_WORDS); $length >= 2; $length--) {
            for ($start = 0; $start + $length <= $count; $start++) {
                $phrase = implode(' ', array_slice($words, $start, $length));

                if (mb_strlen($phrase) < 4) {
                    continue;
                }

                // A phrase can occur twice in one headline; the first is enough.
                $found[$phrase] ??= $start + $length - 1;
            }
        }

        return $found;
    }

    /**
     * Which games answer to any of these names.
     *
     * Notability is an ordering here rather than an exclusion. It used to be a
     * `where`, meant to stop an obscure row named "Word" claiming a headline —
     * but a phrase now has to match a whole catalogue name to be considered at
     * all, and single words never reach this path except through a title an
     * editor typed. Where two games share a name, the one somebody has rated
     * or the aggregator tracks goes first.
     *
     * @param  array<int,string>  $names
     * @return array<string,array<int,array{id:int,year:?int}>>
     */
    private function claimants(array $names): array
    {
        if ($names === []) {
            return [];
        }

        $rows = Game::query()
            ->select(['id', 'name', 'released', 'link_name'])
            ->whereIn('link_name', $names)
            ->orderByRaw('(rating > 0 OR match_key IS NOT NULL) DESC')
            ->orderBy('id')
            ->limit(200)
            ->get();

        $out = [];

        foreach ($rows as $game) {
            $out[$game->link_name][] = [
                'id' => $game->id,
                'year' => $game->released?->year,
            ];
        }

        return $out;
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
