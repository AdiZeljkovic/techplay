<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;
use Illuminate\Support\Facades\DB;

/**
 * The legendary armory: what the account holds, and how many more copies of
 * each would still be useful.
 *
 * `account/legendaryarmory` gives counts and `/v2/legendaryarmory` gives the
 * ceiling per item — rings and accessories take two, some weapons four. Only
 * the two together answer "would a second one of these do anything", which is
 * the question before somebody spends a month on one. Facts from the API and
 * nothing else; how to get a legendary is the planner's business, not this.
 */
class LegendaryArmory
{
    /**
     * @return array<string, mixed>|null Null when the account's armory was never read.
     */
    public function for(int $gw2AccountId): ?array
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

        $ceilings = DB::table('gw2_reference')
            ->where('kind', 'legendaryarmory')
            ->pluck('payload')
            ->mapWithKeys(function ($p) {
                $row = json_decode($p, true) ?: [];

                return isset($row['id']) ? [(int) $row['id'] => (int) ($row['max_count'] ?? 1)] : [];
            })
            ->all();

        $items = DB::table('gw2_items')
            ->whereIn('id', array_keys($held))
            ->get(['id', 'name', 'icon', 'type', 'rarity'])
            ->keyBy('id');

        $owned = [];

        foreach ($held as $id => $count) {
            $item = $items[$id] ?? null;
            $max = $ceilings[$id] ?? null;

            $owned[] = [
                'item_id' => $id,
                'name' => $item?->name,
                'icon' => $item?->icon,
                'type' => $item?->type,
                'count' => $count,
                // Null when the catalogue has not heard of the item yet — a
                // legendary from a patch newer than our last catalogue read.
                'max_count' => $max,
                'room' => $max === null ? null : max(0, $max - $count),
                'wiki' => Wiki::item($id),
            ];
        }

        usort($owned, fn ($a, $b) => [$a['type'], $a['name']] <=> [$b['type'], $b['name']]);

        return [
            'owned' => $owned,
            'in_catalogue' => count($ceilings),
            'owned_count' => count($owned),
        ];
    }
}
