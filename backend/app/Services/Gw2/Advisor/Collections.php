<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Wardrobe, minis, outfits and titles: how much of each the account has, the
 * cheapest missing pieces on the trading post, and the titles nearest to hand.
 *
 * "Cheapest" is a price per piece, never a total. Most of a wardrobe is
 * account-bound or comes from content, and adding the few tradeable pieces into
 * one gold figure would suggest the collection can be bought — it cannot.
 * Prices are the nightly read and carry its date.
 *
 * A key without `unlocks` gives none of this, and the payload says so rather
 * than reporting an empty collection.
 */
class Collections
{
    private const CHEAPEST = 12;

    /**
     * @return array<string, mixed>|null Null when the account's collections were never read.
     */
    public function for(int $gw2AccountId): ?array
    {
        $state = DB::table('gw2_account_state')->where('gw2_account_id', $gw2AccountId)->first(['unlocks', 'achievements']);
        $unlocks = json_decode((string) ($state->unlocks ?? ''), true);

        if (! is_array($unlocks) || ! array_key_exists('skins', $unlocks)) {
            return null;
        }

        $have = fn (string $key) => array_fill_keys(array_map('intval', (array) ($unlocks[$key] ?? [])), true);
        $skins = $have('skins');
        $minis = $have('minis');
        $outfits = $have('outfits');
        $titles = $have('titles');

        $miniCatalogue = $this->reference('minis');
        $outfitCatalogue = $this->reference('outfits');
        $titleCatalogue = $this->reference('titles');
        $skinCount = DB::table('gw2_reference')->where('kind', 'skins')->count();

        // Each missing piece by the item that unlocks it.
        $missingMinis = [];

        foreach ($miniCatalogue as $mini) {
            if (! isset($minis[(int) $mini['id']]) && isset($mini['item_id'])) {
                $missingMinis[(int) $mini['item_id']] = ['id' => (int) $mini['id'], 'name' => $mini['name'] ?? null, 'icon' => $mini['icon'] ?? null];
            }
        }

        $missingOutfits = [];

        foreach ($outfitCatalogue as $outfit) {
            if (isset($outfits[(int) $outfit['id']])) {
                continue;
            }

            foreach ((array) ($outfit['unlock_items'] ?? []) as $itemId) {
                $missingOutfits[(int) $itemId] = ['id' => (int) $outfit['id'], 'name' => $outfit['name'] ?? null, 'icon' => $outfit['icon'] ?? null];
            }
        }

        $missingSkins = [];

        foreach ($this->skinItems() as $skinId => $itemIds) {
            if (isset($skins[$skinId])) {
                continue;
            }

            foreach ($itemIds as $itemId) {
                $missingSkins[$itemId] = ['id' => $skinId, 'name' => null, 'icon' => null];
            }
        }

        $prices = $this->prices(array_merge(array_keys($missingMinis), array_keys($missingOutfits), array_keys($missingSkins)));

        return [
            'counts' => [
                'skins' => ['have' => count($skins), 'total' => $skinCount],
                'minis' => ['have' => count($minis), 'total' => count($miniCatalogue)],
                'outfits' => ['have' => count($outfits), 'total' => count($outfitCatalogue)],
                'titles' => ['have' => count($titles), 'total' => count($titleCatalogue)],
            ],
            'cheapest' => [
                'minis' => $this->cheapest($missingMinis, $prices),
                'outfits' => $this->cheapest($missingOutfits, $prices),
                'skins' => $this->cheapest($missingSkins, $prices),
            ],
            'closest_titles' => $this->closestTitles($titleCatalogue, $titles, json_decode((string) ($state->achievements ?? ''), true) ?: []),
            'prices_observed_at' => $prices === [] ? null : max(array_column($prices, 'observed_at')),
        ];
    }

    /**
     * The cheapest tradeable item for each missing piece, cheapest first.
     *
     * One row per piece, not per item: an outfit with three unlock items is
     * one outfit, priced at the cheapest of them.
     *
     * @param  array<int, array{id: int, name: ?string, icon: ?string}>  $missing  item id => piece
     * @param  array<int, array{sell: int, observed_at: string}>  $prices
     * @return array<int, array<string, mixed>>
     */
    private function cheapest(array $missing, array $prices): array
    {
        $best = [];

        foreach ($missing as $itemId => $piece) {
            if (! isset($prices[$itemId])) {
                continue;
            }

            if (! isset($best[$piece['id']]) || $prices[$itemId]['sell'] < $best[$piece['id']]['sell_unit']) {
                $best[$piece['id']] = [
                    'piece_id' => $piece['id'],
                    'item_id' => $itemId,
                    'name' => $piece['name'],
                    'icon' => $piece['icon'],
                    'sell_unit' => $prices[$itemId]['sell'],
                ];
            }
        }

        usort($best, fn ($a, $b) => $a['sell_unit'] <=> $b['sell_unit']);
        $best = array_slice($best, 0, self::CHEAPEST);

        // Item names for skins, which the skin catalogue names differently
        // from the item a player will search the trading post for.
        $items = DB::table('gw2_items')->whereIn('id', array_column($best, 'item_id'))->get(['id', 'name', 'icon'])->keyBy('id');

        return array_map(fn ($row) => $row + [
            'item_name' => $items[$row['item_id']]->name ?? null,
            'item_icon' => $items[$row['item_id']]->icon ?? null,
            'wiki' => Wiki::item($row['item_id']),
        ], $best);
    }

    /**
     * Titles the account lacks whose achievement it has started, nearest first.
     *
     * @param  array<int, array<string, mixed>>  $catalogue
     * @param  array<int, bool>  $have
     * @param  array<int, array<string, mixed>>  $progress  `account/achievements`
     * @return array<int, array<string, mixed>>
     */
    private function closestTitles(array $catalogue, array $have, array $progress): array
    {
        $byAchievement = [];

        foreach ($progress as $row) {
            if (isset($row['id']) && ! ($row['done'] ?? false) && ($row['max'] ?? 0) > 0) {
                $byAchievement[(int) $row['id']] = $row;
            }
        }

        $out = [];

        foreach ($catalogue as $title) {
            if (isset($have[(int) $title['id']])) {
                continue;
            }

            // `achievement` is the deprecated single field; `achievements`
            // replaced it in 2017 and is what newer titles carry.
            $achievements = array_map('intval', (array) ($title['achievements'] ?? (isset($title['achievement']) ? [$title['achievement']] : [])));

            foreach ($achievements as $achievementId) {
                $row = $byAchievement[$achievementId] ?? null;

                if (! $row) {
                    continue;
                }

                $out[] = [
                    'title_id' => (int) $title['id'],
                    'title' => $title['name'] ?? null,
                    'achievement_id' => $achievementId,
                    'current' => (int) ($row['current'] ?? 0),
                    'max' => (int) $row['max'],
                ];

                break;
            }
        }

        usort($out, fn ($a, $b) => ($b['current'] / max(1, $b['max'])) <=> ($a['current'] / max(1, $a['max'])));
        $out = array_slice($out, 0, 8);

        $names = DB::table('gw2_achievements')->whereIn('id', array_column($out, 'achievement_id'))->pluck('name', 'id');

        return array_map(fn ($t) => $t + [
            'achievement' => $names[$t['achievement_id']] ?? null,
            'wiki' => Wiki::named($names[$t['achievement_id']] ?? null),
        ], $out);
    }

    /**
     * Skin id => the tradeable items whose default skin it is.
     *
     * The one join that has to be worked out in PHP: the link lives inside
     * each item's `details` blob. Restricted to items with a trading post price
     * (about 28,000 of 74,000), and cached per catalogue build, because it only
     * changes when the game does.
     *
     * @return array<int, array<int, int>>
     */
    private function skinItems(): array
    {
        $build = (int) DB::table('gw2_catalog_meta')->where('endpoint', 'items')->value('build_id');

        return Cache::remember("gw2:skin-items:{$build}", 86400, function () {
            $map = [];

            DB::table('gw2_items')
                ->join('gw2_item_prices', 'gw2_item_prices.item_id', '=', 'gw2_items.id')
                ->whereNotNull('gw2_item_prices.sell_unit')
                ->whereIn('gw2_items.type', ['Armor', 'Weapon', 'Back', 'Gathering'])
                ->orderBy('gw2_items.id')
                ->select(['gw2_items.id', 'gw2_items.details'])
                ->chunk(2000, function ($rows) use (&$map) {
                    foreach ($rows as $row) {
                        $skin = json_decode((string) $row->details, true)['default_skin'] ?? null;

                        if ($skin) {
                            $map[(int) $skin][] = (int) $row->id;
                        }
                    }
                });

            return $map;
        });
    }

    /**
     * @param  array<int, int>  $itemIds
     * @return array<int, array{sell: int, observed_at: string}>
     */
    private function prices(array $itemIds): array
    {
        $out = [];

        foreach (array_chunk(array_values(array_unique($itemIds)), 1000) as $chunk) {
            DB::table('gw2_item_prices')
                ->whereIn('item_id', $chunk)
                ->whereNotNull('sell_unit')
                ->get(['item_id', 'sell_unit', 'observed_at'])
                ->each(function ($p) use (&$out) {
                    $out[(int) $p->item_id] = ['sell' => (int) $p->sell_unit, 'observed_at' => (string) $p->observed_at];
                });
        }

        return $out;
    }

    /** @return array<int, array<string, mixed>> */
    private function reference(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->filter(fn ($r) => isset($r['id']))
            ->values()
            ->all();
    }
}
