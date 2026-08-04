<?php

namespace App\Services\Releases;

use App\Models\Game;
use App\Models\GameStoreLink;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Folds the same game, arriving from several stores, into one entry.
 *
 * Call of Duty comes in three times — once from Steam, once from Xbox, once
 * from the eShop — and a calendar showing it three times is worse than useless,
 * because each copy also claims the game is exclusive to the one platform it
 * was found on. Merged, the entry finally tells the truth about where a game is
 * coming out.
 *
 * The bias is the same as everywhere else in this package: guess only when it
 * is safe, and ask when it is not. A pair the rules cannot settle alone is left
 * for an editor rather than fused on a hunch, because an unmerged duplicate is
 * visible and embarrassing while a wrong merge is invisible and wrong.
 */
class GameMerger
{
    /**
     * How many opening characters two titles must share before it is worth
     * scoring how alike they are. Four is enough to keep "Outcasts Reborn" and
     * "Outcast Reborn" in the same bucket while keeping the work near-linear.
     */
    private const BLOCK = 4;

    public function __construct(
        private GameMatcher $matcher,
        private TitleNormalizer $normalizer,
    ) {}

    /**
     * @return array{merged:int,review:int,separate:int}
     */
    public function run(?\Closure $progress = null): array
    {
        $tally = ['merged' => 0, 'review' => 0, 'separate' => 0];

        foreach ($this->candidates() as [$left, $right]) {
            // Both may already have been folded into something else this pass.
            $left = $left->fresh();
            $right = $right->fresh();

            if (! $left || ! $right || $left->id === $right->id) {
                continue;
            }

            $verdict = $this->matcher->verdict($this->describe($left), $this->describe($right));
            $tally[$verdict === GameMatcher::MERGE ? 'merged' : ($verdict === GameMatcher::REVIEW ? 'review' : 'separate')]++;

            if ($verdict === GameMatcher::MERGE) {
                $this->merge(...$this->order($left, $right));
            }

            if ($progress) {
                $progress($left, $right, $verdict);
            }
        }

        return $tally;
    }

    /**
     * Pairs worth asking about: games the aggregator created that carry the
     * same, or nearly the same, normalised title but come from different
     * stores.
     *
     * Two ids in one store are two products — Steam sells a game and its
     * deluxe edition as separate things — so those are never candidates.
     *
     * @return array<int,array{0:Game,1:Game}>
     */
    public function candidates(): array
    {
        $games = Game::query()
            ->whereNotNull('match_key')
            ->where('match_key', '!=', '')
            ->with('storeLinks')
            ->get();

        $pairs = [];

        // Exact agreement first: cheap, and the overwhelming majority.
        foreach ($games->groupBy('match_key') as $group) {
            foreach ($this->crossStorePairs($group) as $pair) {
                $pairs[] = $pair;
            }
        }

        // Then near misses, which is where store-specific punctuation and
        // subtitle habits show up.
        //
        // Comparing every title against every other is a square of the
        // catalogue — fine at a thousand entries and hopeless at ten — so
        // candidates are blocked by their opening characters first. Two
        // spellings of one game agree on how it starts; if they do not, no
        // similarity score was going to save them anyway.
        $threshold = (float) config('releases.matching.review_similarity');

        foreach ($games->groupBy(fn (Game $g) => mb_substr($g->match_key, 0, self::BLOCK)) as $block) {
            $list = $block->values();

            for ($i = 0; $i < $list->count(); $i++) {
                for ($j = $i + 1; $j < $list->count(); $j++) {
                    [$a, $b] = [$list[$i], $list[$j]];

                    if ($a->match_key === $b->match_key || $this->sharesAStore($a, $b)) {
                        continue;
                    }

                    if ($this->matcher->similarity($a->match_key, $b->match_key) >= $threshold) {
                        $pairs[] = [$a, $b];
                    }
                }
            }
        }

        return $pairs;
    }

    /** Pairs within one exact-title group that come from different stores. */
    private function crossStorePairs(Collection $group): array
    {
        $pairs = [];
        $list = $group->values();

        for ($i = 0; $i < $list->count(); $i++) {
            for ($j = $i + 1; $j < $list->count(); $j++) {
                if (! $this->sharesAStore($list[$i], $list[$j])) {
                    $pairs[] = [$list[$i], $list[$j]];
                }
            }
        }

        return $pairs;
    }

    private function sharesAStore(Game $a, Game $b): bool
    {
        $left = $a->storeLinks->pluck('store');
        $right = $b->storeLinks->pluck('store');

        return $left->intersect($right)->isNotEmpty();
    }

    /**
     * Which of the two survives.
     *
     * The older row wins, because it is the one anything else in the database
     * may already be pointing at. Its fields do not automatically win — those
     * are chosen on merit below.
     *
     * @return array{0:Game,1:Game}
     */
    private function order(Game $a, Game $b): array
    {
        return $a->id <= $b->id ? [$a, $b] : [$b, $a];
    }

    /**
     * Fold one game into another.
     *
     * Field by field, the better of the two wins rather than the survivor by
     * default — the whole point of holding three sources is that each knows
     * something the others do not.
     */
    private function merge(Game $keep, Game $drop): void
    {
        DB::transaction(function () use ($keep, $drop) {
            $locked = (array) ($keep->locked_fields ?? []);

            $attributes = [
                // The truth this whole exercise exists to tell.
                'platform_names' => $this->union($keep->platform_names, $drop->platform_names),
                'genre_names' => $this->union($keep->genre_names, $drop->genre_names),
                'background_image' => $this->bestArt($keep, $drop),
                'screenshots_data' => $this->longer($keep->screenshots_data, $drop->screenshots_data),
                'movies_data' => $this->longer($keep->movies_data, $drop->movies_data),
                'metacritic' => $keep->metacritic ?? $drop->metacritic,
                'details_data' => $this->bestDetails($keep, $drop),
                'released' => $this->earliest($keep, $drop),
            ];

            // An editor's correction outranks the merge as it outranks a sync.
            foreach ($locked as $field) {
                unset($attributes[$field]);
            }

            $attributes['has_description'] = filled(data_get($attributes['details_data'] ?? [], 'description'));

            $keep->forceFill($attributes)->save();

            GameStoreLink::where('game_id', $drop->id)->update(['game_id' => $keep->id]);

            $drop->delete();
        });
    }

    /** @return array{title:string,released:?string,publisher:?string} */
    private function describe(Game $game): array
    {
        return [
            'title' => $game->name,
            'released' => $game->released?->toDateString(),
            'publisher' => data_get($game->details_data, 'publisher'),
        ];
    }

    private function union(?array $a, ?array $b): array
    {
        return collect($a ?? [])->merge($b ?? [])->filter()->unique()->values()->all();
    }

    private function longer(?array $a, ?array $b): array
    {
        return count($a ?? []) >= count($b ?? []) ? ($a ?? []) : ($b ?? []);
    }

    /**
     * Art is chosen by store rather than by whichever sync ran last, so the
     * calendar does not change appearance for no reason.
     */
    private function bestArt(Game $keep, Game $drop): ?string
    {
        $priority = (array) config('releases.hero_priority');

        $ranked = collect([$keep, $drop])
            ->filter(fn (Game $g) => filled($g->background_image))
            ->sortBy(function (Game $g) use ($priority) {
                $best = $g->storeLinks
                    ->map(fn (GameStoreLink $l) => array_search($l->store, $priority, true))
                    ->filter(fn ($i) => $i !== false);

                return $best->min() ?? PHP_INT_MAX;
            });

        return $ranked->first()?->background_image ?? $keep->background_image ?? $drop->background_image;
    }

    /** The fuller write-up wins; a publisher we know beats one we do not. */
    private function bestDetails(Game $keep, Game $drop): array
    {
        $a = (array) ($keep->details_data ?? []);
        $b = (array) ($drop->details_data ?? []);

        $descriptions = collect([$a['description'] ?? null, $b['description'] ?? null])
            ->filter()
            ->sortByDesc(fn (string $d) => mb_strlen($d));

        return [
            'description' => $descriptions->first(),
            'publisher' => $a['publisher'] ?? $b['publisher'] ?? null,
            'developer' => $a['developer'] ?? $b['developer'] ?? null,
        ];
    }

    /**
     * Stores disagree by a day or two about a simultaneous launch. The earliest
     * is the honest answer to "when can I play this".
     */
    private function earliest(Game $keep, Game $drop): ?string
    {
        $dates = collect([$keep->released, $drop->released])->filter()->sort();

        return $dates->first()?->toDateString();
    }
}
