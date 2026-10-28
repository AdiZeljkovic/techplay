<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The Wizard's Vault season, and what is still on the shelf before it ends.
 *
 * The season's end date is the only deadline the API publishes anywhere
 * (`/v2/wizardsvault`), and the account's purchases against each listing's limit
 * (`account/wizardsvault/listings`) are the only way to say what is left to buy.
 * Put together with the Astral Acclaim in the wallet, that answers the question
 * a player actually has in the last weeks of a season: what can I still get,
 * and can I afford it.
 *
 * Nothing here is estimated. Unlimited listings are left out because "you can
 * still buy more" says nothing; a listing the account has not been read for yet
 * is not reported as bought.
 */
class VaultSeason
{
    /** Astral Acclaim, in `/v2/currencies`. */
    public const ACCLAIM = 63;

    /**
     * @return array<string, mixed>|null Null when the catalogue has no season yet.
     */
    public function for(Snapshot $snapshot): ?array
    {
        $season = $this->reference('wizardsvault')[0] ?? null;

        if (! $season || ! isset($season['end'])) {
            return null;
        }

        $ends = Carbon::parse($season['end']);
        $balance = $snapshot->currency(self::ACCLAIM);

        return [
            'title' => $season['title'] ?? null,
            'starts_at' => $season['start'] ?? null,
            'ends_at' => $ends->toIso8601String(),
            'days_left' => max(0, (int) floor(now()->diffInHours($ends, false) / 24)),
            'acclaim' => $balance,
            'still_to_buy' => $this->stillToBuy($snapshot->accountId, $balance),
            'notes' => self::NOTES,
        ];
    }

    /**
     * What happens at season end, each with where it is said.
     *
     * The 20% is ours, not ArenaNet's: their posts say only "a slightly higher
     * cost". Comparing the game's own listings archived on 8 March 2026 with
     * the live ones on 28 October 2026, all six rewards that had been Featured
     * were Legacy at exactly 1.2× (375 → 450, 1,000 → 1,200), and the Normal
     * ones did not move at all.
     */
    private const NOTES = [
        [
            'text' => "When the season ends, its Featured rewards move to the Legacy tab at a higher price — 20% more, going by the game's own listings (375 became 450). Normal rewards do not move.",
            'source' => 'https://www.guildwars2.com/en/news/studio-update-guild-wars-2-in-autumn-and-winter-2023/',
        ],
        [
            'text' => 'A new season resets the purchase limits on regular rewards, so whatever is left under a limit now is not carried into the next one.',
            'source' => 'https://web.archive.org/web/20231126223359/https://en-forum.guildwars2.com/topic/139682-game-update-notes-november-7-2023',
        ],
    ];

    /**
     * Limited listings the account has not maxed out, cheapest first within
     * each type.
     *
     * @return array<string, mixed>|null Null when the account's purchases have never been read.
     */
    private function stillToBuy(int $accountId, int $balance): ?array
    {
        $raw = DB::table('gw2_account_state')->where('gw2_account_id', $accountId)->value('vault_listings');

        if ($raw === null) {
            return null;
        }

        $listings = array_filter(
            json_decode($raw, true) ?: [],
            // `purchase_limit` is omitted for unlimited rewards.
            fn ($l) => isset($l['purchase_limit']) && (int) ($l['purchased'] ?? 0) < (int) $l['purchase_limit']
        );

        $items = DB::table('gw2_items')
            ->whereIn('id', array_values(array_unique(array_map(fn ($l) => (int) ($l['item_id'] ?? 0), $listings))))
            ->get(['id', 'name', 'icon', 'rarity'])
            ->keyBy('id');

        $rows = array_map(function (array $l) use ($items, $balance) {
            $item = $items[(int) ($l['item_id'] ?? 0)] ?? null;
            $left = (int) $l['purchase_limit'] - (int) ($l['purchased'] ?? 0);

            return [
                'id' => (int) $l['id'],
                'item_id' => (int) ($l['item_id'] ?? 0),
                'name' => $item?->name,
                'icon' => $item?->icon,
                'rarity' => $item?->rarity,
                'count' => (int) ($l['item_count'] ?? 1),
                'type' => $l['type'] ?? null,
                'cost' => (int) ($l['cost'] ?? 0),
                'left' => $left,
                'affordable' => (int) ($l['cost'] ?? 0) <= $balance,
                'wiki' => isset($l['item_id']) ? Wiki::item((int) $l['item_id']) : null,
            ];
        }, array_values($listings));

        $order = ['Featured' => 0, 'Normal' => 1, 'Legacy' => 2];
        usort($rows, fn ($a, $b) => [$order[$a['type']] ?? 3, $a['cost']] <=> [$order[$b['type']] ?? 3, $b['cost']]);

        return [
            'listings' => $rows,
            // Everything left at the limit, priced. Not a recommendation to buy
            // it all — the figure that says whether the balance even comes close.
            'cost_of_everything' => array_sum(array_map(fn ($r) => $r['cost'] * $r['left'], $rows)),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function reference(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->orderBy('ref_id')
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->all();
    }
}
