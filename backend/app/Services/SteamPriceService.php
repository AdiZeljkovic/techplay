<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * What Steam charges, in dollars, for the games on people's shelves.
 *
 * Steam is the only storefront that will price a list. Verified against all six
 * on 1 Sep 2026: Xbox and Nintendo both answer and both batch, GOG answers one
 * game at a time, PlayStation only from the HTML of a 472 KB product page, and
 * Epic returns 403 from behind Cloudflare on every route.
 *
 * The three console stores are nonetheless not used, because the keys are not
 * there: of 187 Xbox games sitting on shelves, none carries an Xbox store id —
 * the catalogue's 42,344 Xbox links belong to release-calendar entries nobody
 * owns. A price fetcher for Xbox written today would price one game.
 *
 * So: Steam, for everything. A game bought on Epic or GOG is usually sold on
 * Steam too, and `priceByName()` finds it — Borderlands 2 came onto a shelf
 * from Epic with no Steam id at all, and the search returns 49520 and $19.99
 * together. The id is kept, so the next run costs nothing.
 *
 * US market throughout: it is the one storefront every game is listed in, and
 * one currency beats five. Xbox and Nintendo both refuse `BA` outright.
 */
class SteamPriceService
{
    /** Steam takes a comma-separated list here; a hundred is comfortable. */
    public const BATCH = 100;

    private const APPDETAILS = 'https://store.steampowered.com/api/appdetails';

    private const SEARCH = 'https://store.steampowered.com/api/storesearch/';

    /**
     * Prices for a batch of app ids.
     *
     * @param  array<int,int>  $appIds
     * @return array<int,array{status:string,currency:string,full:?int,final:?int,discount:int}>
     *                                                                                           Keyed by app id. Every id asked for comes back, so a caller can tell
     *                                                                                           "Steam says nothing" from "we never asked".
     */
    public function pricesFor(array $appIds): array
    {
        if ($appIds === []) {
            return [];
        }

        $out = [];

        foreach (array_chunk(array_values(array_unique($appIds)), self::BATCH) as $chunk) {
            $response = Http::timeout(30)->retry(2, 2000, throw: false)->get(self::APPDETAILS, [
                'appids' => implode(',', $chunk),
                'cc' => 'us',
                'filters' => 'price_overview',
            ]);

            if (! $response->successful()) {
                Log::warning('SteamPriceService: batch refused', ['status' => $response->status(), 'count' => count($chunk)]);

                continue;
            }

            foreach ($chunk as $appId) {
                $row = $response->json((string) $appId);
                $out[$appId] = $this->read($row);
            }
        }

        return $out;
    }

    /**
     * Find a game on Steam by name, for the ones that arrived from another
     * store and were never given an app id.
     *
     * Returns the id as well as the price: the caller records it, and the game
     * joins the cheap batch path from then on.
     *
     * @return array{app_id:int,name:string,status:string,currency:string,full:?int,final:?int,discount:int}|null
     */
    public function priceByName(string $name): ?array
    {
        $response = Http::timeout(20)->retry(1, 1500, throw: false)
            ->get(self::SEARCH, ['term' => $name, 'cc' => 'us', 'l' => 'en']);

        if (! $response->successful()) {
            return null;
        }

        $items = $response->json('items');

        if (! is_array($items) || $items === []) {
            return null;
        }

        /*
         * The whole first page, not just the first row.
         *
         * Steam ranks a search the way a shop does, so an exact title is often
         * not first: searching "Inside" returns "Inside the Backrooms",
         * "Organized Inside", and INSIDE itself in third place. Reading
         * `items.0` alone left that game — and everything else with a common
         * word for a name — recorded as having no price at all.
         */
        $wanted = $this->flatten($name);

        foreach (array_slice($items, 0, 8) as $item) {
            if (! is_array($item) || empty($item['id'])) {
                continue;
            }

            if ($this->flatten((string) ($item['name'] ?? '')) !== $wanted) {
                continue;
            }

            return $this->fromSearchItem($item);
        }

        return null;
    }

    /** @param  array<string,mixed>  $item */
    private function fromSearchItem(array $item): array
    {
        $price = $item['price'] ?? null;

        return [
            'app_id' => (int) $item['id'],
            'name' => (string) $item['name'],
            // storesearch reports `initial` only while a game is discounted;
            // at full price it sends `final` alone, and they are the same number.
            'status' => is_array($price) ? 'priced' : 'free',
            'currency' => is_array($price) ? (string) ($price['currency'] ?? 'USD') : 'USD',
            'full' => is_array($price) ? (int) ($price['initial'] ?? $price['final'] ?? 0) : 0,
            'final' => is_array($price) ? (int) ($price['final'] ?? 0) : 0,
            'discount' => is_array($price) ? (int) ($price['discount_percent'] ?? 0) : 0,
        ];
    }

    /**
     * One appdetails answer, read honestly.
     *
     * `success: false` means Steam has no such app, or will not sell it here —
     * delisted, region-locked, or a package rather than a game. GTA V answers
     * exactly this today. It is recorded as `unavailable` rather than as zero,
     * because a total that counts a missing price as nothing is a total that
     * understates itself without saying so.
     *
     * `success: true` with no `price_overview` is free-to-play, which is a real
     * price and counts as one.
     *
     * @return array{status:string,currency:string,full:?int,final:?int,discount:int}
     */
    private function read(mixed $row): array
    {
        $none = ['status' => 'unavailable', 'currency' => 'USD', 'full' => null, 'final' => null, 'discount' => 0];

        if (! is_array($row) || ! ($row['success'] ?? false)) {
            return $none;
        }

        $price = $row['data']['price_overview'] ?? null;

        if (! is_array($price)) {
            return ['status' => 'free', 'currency' => 'USD', 'full' => 0, 'final' => 0, 'discount' => 0];
        }

        return [
            'status' => 'priced',
            'currency' => (string) ($price['currency'] ?? 'USD'),
            // `initial` is the price before any sale — the figure a library
            // totals, so its worth does not swing with the weekly discounts.
            'full' => (int) ($price['initial'] ?? $price['final'] ?? 0),
            'final' => (int) ($price['final'] ?? 0),
            'discount' => (int) ($price['discount_percent'] ?? 0),
        ];
    }

    /**
     * Case, punctuation and trademarks removed, for comparing two titles.
     *
     * A trailing year in brackets goes too. Steam distinguishes remakes that
     * way — "Layers of Fear 2 (2019)" is the game our catalogue simply calls
     * "Layers of Fear 2" — and without this the search finds the right row and
     * then throws it away.
     */
    private function flatten(string $s): string
    {
        $s = preg_replace('/\s*\((?:19|20)\d{2}\)\s*$/', '', trim($s)) ?? $s;

        return preg_replace('/[^a-z0-9]+/', '', mb_strtolower($s)) ?? '';
    }
}
