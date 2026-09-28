<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Decide which recipe pages are worth indexing.
 *
 * Two rules, both measured rather than chosen:
 *
 * **Ascended and Legendary craftables.** 1,904 items. These are the endgame
 * pieces people plan for months ahead, which is exactly the search this section
 * answers.
 *
 * **Materials that a lot of recipes need.** 90 items at a threshold of fifty,
 * and the list is its own justification: Glob of Ectoplasm (907 recipes), Vision
 * Crystal (899), Pile of Crystalline Dust (280), Mithril Ingot (174). Somebody
 * searching "how much ectoplasm" is a real person; somebody searching for the
 * 11,000th vendor trinket is not.
 *
 * Exotic is deliberately out. It is 3,187 craftable items on its own — including
 * it would take the set to 5,738 and barely narrow anything, which defeats the
 * point of narrowing.
 *
 * What the command will not do is touch a row a person has reviewed. That is the
 * whole reason the flag is data rather than a query: widening the set is an
 * editor's decision, and this command must not undo it on the next run.
 */
class PickGw2IndexablePages extends Command
{
    protected $signature = 'gw2:pick-indexable
        {--materials=50 : How many recipes a material must appear in}
        {--rarities=Ascended,Legendary : Craftable rarities that always qualify}
        {--dry : Count what would change and write nothing}';

    protected $description = 'Choose which Guild Wars 2 recipe pages are indexable';

    public function handle(): int
    {
        $threshold = max(1, (int) $this->option('materials'));
        $rarities = array_filter(array_map('trim', explode(',', (string) $this->option('rarities'))));

        $this->line('Rarities: <info>'.implode(', ', $rarities).'</info>');
        $this->line("Material threshold: <info>{$threshold}</info> recipes");
        $this->newLine();

        $byRarity = $this->craftableIn($rarities);
        $byUse = $this->materialsUsedAtLeast($threshold);

        // A material that is also an ascended craftable should say why it is
        // really here, so the rarity reason wins.
        $chosen = [];
        foreach ($byUse as $id) {
            $chosen[$id] = 'material';
        }
        foreach ($byRarity as $id) {
            $chosen[$id] = 'rarity';
        }

        $reviewed = DB::table('gw2_items')
            ->whereNotNull('indexable_reviewed_at')
            ->pluck('id')
            ->all();

        $this->table(
            ['Source', 'Items'],
            [
                ['Craftable at those rarities', number_format(count($byRarity))],
                ["Materials in {$threshold}+ recipes", number_format(count($byUse))],
                ['Together, deduplicated', number_format(count($chosen))],
                ['Reviewed by a person, left alone', number_format(count($reviewed))],
            ]
        );

        if ($this->option('dry')) {
            $this->warn('Dry run — nothing written.');

            return self::SUCCESS;
        }

        $changed = DB::transaction(function () use ($chosen, $reviewed) {
            /*
             * Clear first, then set. A rule that narrows has to be able to take
             * pages back out, and doing it in one transaction means no crawler
             * ever sees a half-applied set.
             */
            $cleared = DB::table('gw2_items')
                ->where('is_indexable', true)
                ->whereNotIn('id', $reviewed)
                ->update(['is_indexable' => false, 'indexable_reason' => null]);

            $set = 0;

            foreach (array_chunk(array_keys($chosen), 1000, true) as $chunk) {
                foreach (['rarity', 'material'] as $reason) {
                    $ids = array_keys(array_filter($chunk, fn ($r) => $r === $reason));

                    if ($ids === []) {
                        continue;
                    }

                    $set += DB::table('gw2_items')
                        ->whereIn('id', $ids)
                        ->whereNotIn('id', $reviewed)
                        ->where('name', '!=', '')
                        ->update(['is_indexable' => true, 'indexable_reason' => $reason]);
                }
            }

            return ['cleared' => $cleared, 'set' => $set];
        });

        $total = DB::table('gw2_items')->where('is_indexable', true)->count();

        $this->newLine();
        $this->info(sprintf(
            '%s pages indexable (%s set, %s cleared).',
            number_format($total),
            number_format($changed['set']),
            number_format($changed['cleared'])
        ));

        /*
         * The sitemap reads this flag, and the index that names the sitemap is
         * written by the content half of the generator. Saying so here is
         * cheaper than the confused minute it cost the first time.
         */
        $this->line('<fg=gray>Run `sitemap:generate` (both halves) for this to reach Google.</>');

        return self::SUCCESS;
    }

    /**
     * @param  array<int, string>  $rarities
     * @return array<int, int>
     */
    private function craftableIn(array $rarities): array
    {
        return DB::table('gw2_items')
            ->whereIn('rarity', $rarities)
            ->where('name', '!=', '')
            ->whereExists(fn ($q) => $q->selectRaw('1')
                ->from('gw2_recipes')
                ->whereColumn('gw2_recipes.output_item_id', 'gw2_items.id'))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Items that appear as an ingredient in at least this many recipes.
     *
     * PostgreSQL only, and that is fine: this is a production curation task over
     * 13,198 jsonb rows, not something the test suite needs to run.
     *
     * @return array<int, int>
     */
    private function materialsUsedAtLeast(int $threshold): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->warn('Material counting needs PostgreSQL; skipping that half.');

            return [];
        }

        $rows = DB::select(
            "select (ing->>'item_id')::bigint as item_id
               from gw2_recipes r, jsonb_array_elements(r.ingredients) ing
              group by 1
             having count(*) >= ?",
            [$threshold]
        );

        return array_map('intval', array_column($rows, 'item_id'));
    }
}
