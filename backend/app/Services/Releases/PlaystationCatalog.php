<?php

namespace App\Services\Releases;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Reads the PlayStation store.
 *
 * The most fragile source in this package, and the only one without an API of
 * any kind. Sony's GraphQL endpoint accepts none but its own whitelisted
 * queries, and the storefront is client-rendered, so the way in is the server's
 * own page payload.
 *
 * It is steadier than that sounds. Each product page carries its record as JSON
 * — the same JSON the browser would use — inside __NEXT_DATA__, and we read
 * that rather than the rendered markup. A redesign of how the page looks does
 * not touch it. A change to how the page is assembled would, which is why
 * PlayStation is the store most likely to need attention, and why an editor can
 * always correct a release by hand.
 */
class PlaystationCatalog
{
    use TalksToStores;

    private const SITE = 'https://store.playstation.com';

    /** Sony's "Coming Soon" collection. */
    private const CATEGORY = '44d8bb20-653e-431e-8ad0-c0a365f68d2f';

    /** The listing pages hold 24 each and run to several hundred products. */
    private const MAX_PAGES = 60;

    /**
     * Every product in the coming-soon collection.
     *
     * @return array<int,string>
     *
     * @throws TransientFailure
     */
    public function productIds(): array
    {
        $ids = [];

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            $found = $this->idsOnPage($page);
            $new = array_diff($found, array_keys($ids));

            if ($new === []) {
                break;
            }

            foreach ($new as $id) {
                $ids[$id] = true;
            }
        }

        Log::info('playstation listing walked', ['products' => count($ids)]);

        return array_keys($ids);
    }

    /**
     * One product's record.
     *
     * Returns null when the page carries no product — a listing that has been
     * pulled, or a page shape we no longer recognise.
     *
     * @throws TransientFailure
     */
    public function details(string $id): ?array
    {
        try {
            $response = $this->http(30)->get(self::SITE.'/en-us/product/'.$id);
        } catch (ConnectionException $e) {
            throw new TransientFailure('playstation unreachable: '.$e->getMessage());
        }

        if ($response->status() === 404) {
            return null;
        }

        if (! $response->successful()) {
            throw new TransientFailure('playstation answered '.$response->status());
        }

        $cache = $this->cacheIn($response->body());

        return $cache === [] ? null : $this->present($id, $cache);
    }

    /** @return array<int,string> */
    private function idsOnPage(int $page): array
    {
        try {
            $response = $this->http(30)->get(self::SITE.'/en-us/category/'.self::CATEGORY.'/'.$page);
        } catch (ConnectionException $e) {
            throw new TransientFailure('playstation unreachable: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new TransientFailure('playstation answered '.$response->status());
        }

        preg_match_all('#/en-us/product/([A-Za-z0-9_\-]+)#', $response->body(), $m);

        return array_values(array_unique($m[1] ?? []));
    }

    /**
     * The store's own data, pulled out of the page it rendered.
     *
     * The page assembles itself from fragments, each carrying a slice of an
     * Apollo cache as embedded JSON. Reading every fragment and merging them is
     * both simpler than guessing which one holds what and more forgiving of
     * Sony moving things between them.
     *
     * @return array<string,array>
     */
    private function cacheIn(string $html): array
    {
        if (! preg_match('/id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s', $html, $m)) {
            return [];
        }

        $next = json_decode($m[1], true);
        $merged = [];

        foreach (($next['props']['pageProps']['batarangs'] ?? []) as $fragment) {
            if (! preg_match_all('#<script[^>]*type="application/json"[^>]*>(.*?)</script>#s', (string) ($fragment['text'] ?? ''), $islands)) {
                continue;
            }

            foreach ($islands[1] as $island) {
                $decoded = json_decode(html_entity_decode($island), true);

                foreach (($decoded['cache'] ?? []) as $key => $record) {
                    // Fragments carry overlapping slices of the same records,
                    // and most of them are thin: the one that renders the buy
                    // button knows a product's name and nothing else. Union
                    // rather than replace, or whichever fragment happens to
                    // come last silently erases the release date.
                    $merged[$key] = is_array($record) && is_array($merged[$key] ?? null)
                        ? $merged[$key] + $record
                        : ($merged[$key] ?? $record);
                }
            }
        }

        return $merged;
    }

    /** @param  array<string,array>  $cache */
    private function present(string $id, array $cache): ?array
    {
        $product = $cache['Product:'.$id] ?? collect($cache)
            ->first(fn ($record) => is_array($record) && isset($record['releaseDate'], $record['name']));

        if (! is_array($product) || blank($product['releaseDate'] ?? null) || blank($product['name'] ?? null)) {
            return null;
        }

        $media = $this->mediaIn($cache);
        $screenshots = $media->where('role', 'SCREENSHOT')->pluck('url')->unique()->values()->all();

        return [
            'store_id' => $id,
            'title' => trim((string) $product['name']),
            'anchor' => Carbon::parse($product['releaseDate'])->startOfDay(),
            'precision' => 'day',
            'url' => self::SITE.'/en-us/product/'.$id,

            // FULL_GAME is the only classification that belongs on a calendar;
            // the rest are add-ons, currency and season passes.
            'type' => ($product['storeDisplayClassification'] ?? '') === 'FULL_GAME'
                && ($product['topCategory'] ?? '') === 'GAME'
                    ? 'game'
                    : mb_strtolower((string) ($product['storeDisplayClassification'] ?? 'unknown')),

            'description' => $this->description($product),
            'hero' => $this->hero($media),
            'publisher' => $product['publisherName'] ?? null,
            'developer' => null,
            'genres' => [],
            'platforms' => $this->platforms((array) ($product['platforms'] ?? [])),
            'metacritic' => null,

            'screenshots' => count($screenshots),
            'screenshot_urls' => $screenshots,
            'has_trailer' => false,
            'trailer_urls' => [],

            // Sony does not list adult products on the storefront at all.
            'adult' => false,
        ];
    }

    /**
     * Every image in the payload, wherever Sony has put it.
     *
     * Art does not sit beside the product: it hangs off the concept the product
     * belongs to, nested two levels down. Gathering it by shape rather than by
     * path means the images survive Sony moving them, which is worth doing for
     * the one source here that has no API to be stable about.
     *
     * @param  array<string,mixed>  $cache
     * @return Collection<int,array>
     */
    private function mediaIn(array $cache): Collection
    {
        $found = [];

        $walk = function ($node) use (&$walk, &$found) {
            if (! is_array($node)) {
                return;
            }

            if (isset($node['role'], $node['url']) && is_string($node['url'])) {
                $found[$node['url']] = ['role' => $node['role'], 'url' => $node['url']];

                return;
            }

            foreach ($node as $child) {
                $walk($child);
            }
        };

        $walk($cache);

        return collect(array_values($found));
    }

    /** Sony files several kinds of copy together; the legal one is not it. */
    private function description(array $product): string
    {
        return trim((string) collect($product['descriptions'] ?? [])
            ->reject(fn ($d) => ($d['type'] ?? '') === 'LEGAL')
            ->pluck('value')
            ->map(fn ($v) => strip_tags((string) $v))
            ->filter()
            ->first());
    }

    /** The wide banner, which is the shape a calendar card wants. */
    private function hero(Collection $media): ?string
    {
        foreach (['SIXTEEN_BY_NINE_BANNER', 'MASTER', 'GAMEHUB_COVER_ART', 'BACKGROUND'] as $role) {
            $url = $media->where('role', $role)->pluck('url')->first();

            if ($url) {
                return $url;
            }
        }

        return $media->pluck('url')->first();
    }

    /** @param  array<int,string>  $platforms */
    private function platforms(array $platforms): array
    {
        $names = ['PS5' => 'PlayStation 5', 'PS4' => 'PlayStation 4'];

        $out = collect($platforms)->map(fn (string $p) => $names[$p] ?? $p)->filter()->unique()->values()->all();

        return $out ?: ['PlayStation'];
    }
}
