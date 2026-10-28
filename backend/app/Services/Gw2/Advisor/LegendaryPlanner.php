<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\ForgeDataset;
use App\Services\Gw2\Wiki;
use Illuminate\Support\Facades\DB;

/**
 * Every legendary, what this account holds of it, and whether we can plan it.
 *
 * The list is the API's own (`/v2/legendaryarmory`, 206 items), so nothing on
 * it is ours to get wrong. What is ours is the "can we plan it" column: an item
 * is plannable when its last step is either a discipline recipe the API has or
 * a Mystic Forge recipe with a named source — since 28 Oct 2026 mostly the
 * gw2efficiency dataset (`ForgeDataset`), as of February 2026. Everything else
 * says plainly that the recipe is not in yet, rather than planning half a
 * legendary and letting the missing half look like nothing.
 *
 * The plan itself is the ordinary crafting planner — same tree, same stock
 * subtraction, wallet included — reached with the item preselected.
 */
class LegendaryPlanner
{
    /**
     * @return array<string, mixed>
     */
    public function catalogue(?int $gw2AccountId): array
    {
        $ceilings = DB::table('gw2_reference')
            ->where('kind', 'legendaryarmory')
            ->pluck('payload')
            ->mapWithKeys(function ($p) {
                $row = json_decode($p, true) ?: [];

                return isset($row['id']) ? [(int) $row['id'] => (int) ($row['max_count'] ?? 1)] : [];
            })
            ->all();

        $ids = array_keys($ceilings);

        $items = DB::table('gw2_items')->whereIn('id', $ids)->get(['id', 'name', 'type', 'icon', 'details'])->keyBy('id');
        $withRecipe = DB::table('gw2_recipes')->whereIn('output_item_id', $ids)->pluck('output_item_id')->flip();
        $withForge = DB::table('gw2_forge_recipes')
            ->whereIn('output_item_id', $ids)
            ->whereNotNull('checked_at')
            ->whereNotNull('source_url')
            ->pluck('output_item_id')
            ->flip();

        $held = $gw2AccountId ? $this->held($gw2AccountId) : null;

        $rows = [];

        foreach ($ceilings as $id => $max) {
            $item = $items[$id] ?? null;

            $rows[] = [
                'item_id' => $id,
                'name' => $item?->name,
                'type' => $item?->type,
                // Weapon, armour weight or trinket kind — what a reader filters by.
                'subtype' => json_decode((string) ($item?->details ?? ''), true)['type'] ?? null,
                'icon' => $item?->icon,
                'max_count' => $max,
                'held' => $held === null ? null : ($held[$id] ?? 0),
                'plannable' => isset($withRecipe[$id]) ? 'recipe' : (isset($withForge[$id]) ? 'forge' : null),
                'wiki' => Wiki::item($id),
            ];
        }

        usort($rows, fn ($a, $b) => [$a['type'], $a['subtype'], $a['name']] <=> [$b['type'], $b['subtype'], $b['name']]);

        return [
            'legendaries' => $rows,
            'forge_recipes_checked' => DB::table('gw2_forge_recipes')->whereNotNull('checked_at')->whereNotNull('source_url')->count(),
            /*
             * Where the forge recipes come from, so the page can credit them.
             * Most are one open dataset whose licence asks for exactly that;
             * the rest are an editor's, each under its own label.
             */
            'forge_sources' => DB::table('gw2_forge_recipes')
                ->whereNotNull('checked_at')
                ->whereNotNull('source_url')
                ->selectRaw('source_label, min(source_url) as url, count(*) as recipes, max(checked_at) as as_of')
                ->groupBy('source_label')
                ->orderByDesc('recipes')
                ->get()
                ->map(fn ($r) => [
                    'label' => $r->source_label,
                    'url' => $r->url,
                    'recipes' => (int) $r->recipes,
                    'as_of' => $r->as_of ? (string) $r->as_of : null,
                    'note' => $r->source_label === ForgeDataset::LABEL ? ForgeDataset::NOTE : null,
                ])
                ->all(),
            // Null when the armory was never read for this account.
            'armory_known' => $held !== null,
        ];
    }

    /**
     * What in this plan is gated by a daily craft, and whether today's is used.
     *
     * Time-gated materials cap how fast a legendary can go, and today's craft
     * is the one thing a player can lose by not doing it. Matched by name
     * against the game's own daily-craft list: `lump_of_mithrilium` is the item
     * "Lump of Mithrilium".
     *
     * @param  array<string, mixed>  $tree  A plan tree from Dashboard::plan().
     * @param  array<int, string>|null  $doneToday  `account/dailycrafting`
     * @return array<int, array<string, mixed>>
     */
    public function today(array $tree, ?array $doneToday): array
    {
        $gated = DB::table('gw2_reference')
            ->where('kind', 'dailycrafting')
            ->pluck('payload')
            ->map(fn ($p) => (string) (json_decode($p, true)['id'] ?? ''))
            ->filter()
            ->flip()
            ->all();

        $found = [];

        $walk = function (array $node) use (&$walk, &$found, $gated, $doneToday) {
            $slug = strtolower((string) preg_replace('/[^A-Za-z0-9]+/', '_', (string) ($node['name'] ?? '')));

            if (($node['missing'] ?? 0) > 0 && isset($gated[$slug])) {
                $found[$slug] ??= [
                    'id' => $slug,
                    'item_id' => $node['item_id'],
                    'name' => $node['name'],
                    'missing' => 0,
                    'crafted_today' => $doneToday === null ? null : in_array($slug, $doneToday, true),
                ];
                $found[$slug]['missing'] += (int) $node['missing'];
            }

            foreach ($node['children'] ?? [] as $child) {
                $walk($child);
            }
        };

        $walk($tree);

        return array_values($found);
    }

    /** @return array<int, int>|null item id => count; null when never read */
    private function held(int $gw2AccountId): ?array
    {
        $unlocks = json_decode((string) DB::table('gw2_account_state')
            ->where('gw2_account_id', $gw2AccountId)
            ->value('unlocks'), true);

        if (! is_array($unlocks) || ! array_key_exists('legendary_armory', $unlocks)) {
            return null;
        }

        $held = [];

        foreach ((array) $unlocks['legendary_armory'] as $entry) {
            if (isset($entry['id'])) {
                $held[(int) $entry['id']] = (int) ($entry['count'] ?? 1);
            }
        }

        return $held;
    }
}
