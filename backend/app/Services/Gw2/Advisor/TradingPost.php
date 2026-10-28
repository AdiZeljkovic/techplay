<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;
use Illuminate\Support\Facades\DB;

/**
 * The trading post counter: what is waiting to be picked up, and what is
 * listed.
 *
 * `commerce/delivery` and `commerce/transactions/current/*` — the gold and items
 * sitting at the counter, and the open buy and sell orders. A forgotten pile of
 * gold at the counter is the most common thing this finds.
 *
 * Deliberately no "you have been undercut". That needs the price as it is now;
 * ours is read once a night, and a warning built on it would be wrong for most
 * of the day. The orders are listed at the price the player set, and that is
 * all that is claimed.
 */
class TradingPost
{
    /**
     * @return array<string, mixed>|null Null for a key without the `tradingpost` scope, or never read.
     */
    public function for(int $gw2AccountId): ?array
    {
        $state = DB::table('gw2_account_state')->where('gw2_account_id', $gw2AccountId)->first(['trading_post', 'observed_at']);
        $tp = json_decode((string) ($state->trading_post ?? ''), true);

        if (! is_array($tp)) {
            return null;
        }

        $delivery = (array) ($tp['delivery'] ?? []);
        $buys = (array) ($tp['buys'] ?? []);
        $sells = (array) ($tp['sells'] ?? []);

        $ids = array_merge(
            array_map(fn ($i) => (int) ($i['id'] ?? 0), (array) ($delivery['items'] ?? [])),
            array_map(fn ($o) => (int) ($o['item_id'] ?? 0), $buys),
            array_map(fn ($o) => (int) ($o['item_id'] ?? 0), $sells),
        );

        $items = DB::table('gw2_items')->whereIn('id', array_unique($ids))->get(['id', 'name', 'icon', 'rarity'])->keyBy('id');

        $describe = fn (int $id) => [
            'item_id' => $id,
            'name' => $items[$id]->name ?? null,
            'icon' => $items[$id]->icon ?? null,
            'rarity' => $items[$id]->rarity ?? null,
            'wiki' => Wiki::item($id),
        ];

        $orders = fn (array $list) => array_map(fn ($o) => $describe((int) ($o['item_id'] ?? 0)) + [
            'price' => (int) ($o['price'] ?? 0),
            'quantity' => (int) ($o['quantity'] ?? 0),
            'created' => $o['created'] ?? null,
        ], $list);

        return [
            'waiting' => [
                'coins' => (int) ($delivery['coins'] ?? 0),
                'items' => array_map(fn ($i) => $describe((int) ($i['id'] ?? 0)) + ['count' => (int) ($i['count'] ?? 1)], (array) ($delivery['items'] ?? [])),
            ],
            'buys' => $orders($buys),
            'sells' => $orders($sells),
            // Copper set aside in open buy orders: spent from the wallet the
            // moment the order went up, and back only if it is cancelled.
            'in_buy_orders' => array_sum(array_map(fn ($o) => (int) ($o['price'] ?? 0) * (int) ($o['quantity'] ?? 0), $buys)),
            // What the sell orders would bring at the listed price, before the
            // trading post's cut. Not a valuation of anything else.
            'listed_for' => array_sum(array_map(fn ($o) => (int) ($o['price'] ?? 0) * (int) ($o['quantity'] ?? 0), $sells)),
            'observed_at' => $state->observed_at ?? null,
        ];
    }
}
