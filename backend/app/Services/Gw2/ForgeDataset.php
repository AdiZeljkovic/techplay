<?php

namespace App\Services\Gw2;

use Illuminate\Support\Facades\DB;

/**
 * Mystic Forge recipes from gw2efficiency custom-recipes, the one open dataset.
 *
 * The API publishes no forge recipes, and the owner cannot enter two thousand
 * by hand, so on 28 Oct 2026 they chose this dataset (GPL-3.0, frozen at
 * February 2026; see NOTICE.md beside the file). Every row keeps its source,
 * and `checked_at` is the date the source vouches for — the commit's — not a
 * check in game, which is why the pages say "as of" rather than "checked".
 *
 * A recipe is loaded only when its output and every ingredient are items the
 * game still lists: a node without a name is worse than no node. Rows an
 * editor entered under another source are never touched; an older version of
 * this dataset is replaced as a whole.
 */
class ForgeDataset
{
    public const LABEL = 'gw2efficiency custom-recipes (GPL-3.0)';

    public const URL = 'https://github.com/holoxx/custom-recipes/tree/82343e2f73ec677e1257554cc96b489398fd0a1d';

    /** The commit's date, 7 Feb 2026 — what the data is as of. */
    public const AS_OF = '2026-02-07 00:00:00';

    /** Said beside the credit, so a missing legendary is not a mystery. */
    public const NOTE = 'Not checked in game. Legendaries released after February 2026 (Wages of Stars, Stella Radians, Strife Unending) are not in it.';

    private const FILE = 'data/gw2efficiency-custom-recipes/mystic-forge.json';

    /**
     * Null when this version is already in, or there are no items to check
     * the ids against yet.
     *
     * @return array{inserted: int, skipped: int, replaced: int}|null
     */
    public function load(): ?array
    {
        if (DB::table('gw2_forge_recipes')->where('source_url', self::URL)->exists()) {
            return null;
        }

        // Before the first catalogue read there is nothing to check ids
        // against; the catalogue command calls this again once there is.
        if (! DB::table('gw2_items')->exists()) {
            return null;
        }

        $recipes = json_decode((string) file_get_contents(database_path(self::FILE)), true) ?: [];

        $ids = [];

        foreach ($recipes as $recipe) {
            $ids[$recipe['output_item_id']] = true;

            foreach ($recipe['ingredients'] as $ingredient) {
                $ids[$ingredient['id']] = true;
            }
        }

        $known = [];

        foreach (array_chunk(array_keys($ids), 500) as $chunk) {
            foreach (DB::table('gw2_items')->whereIn('id', $chunk)->pluck('id') as $id) {
                $known[(int) $id] = true;
            }
        }

        $rows = [];
        $skipped = 0;
        $now = now();

        foreach ($recipes as $recipe) {
            $all = [$recipe['output_item_id'], ...array_column($recipe['ingredients'], 'id')];

            if (array_diff_key(array_flip($all), $known) !== []) {
                $skipped++;

                continue;
            }

            $rows[] = [
                'output_item_id' => $recipe['output_item_id'],
                'output_count' => $recipe['output_count'],
                'ingredients' => json_encode($recipe['ingredients']),
                'source_url' => self::URL,
                'source_label' => self::LABEL,
                'checked_at' => self::AS_OF,
                'notes' => 'Imported from the dataset at commit 82343e2f. Not checked in game.',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        return DB::transaction(function () use ($rows, $skipped) {
            $replaced = DB::table('gw2_forge_recipes')->where('source_label', self::LABEL)->delete();

            foreach (array_chunk($rows, 200) as $chunk) {
                DB::table('gw2_forge_recipes')->insert($chunk);
            }

            return ['inserted' => count($rows), 'skipped' => $skipped, 'replaced' => $replaced];
        });
    }
}
