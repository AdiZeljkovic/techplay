<?php

namespace App\Services\Releases;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Reads the Xbox store.
 *
 * Xbox is the awkward one. Steam and Nintendo both name a release date in their
 * listings, so we know what is still to come before spending anything. Xbox
 * publishes no such list: the store's browse API answers the same fixed fifty
 * products whatever it is asked, and the only enumerable index of the catalogue
 * is the sitemap — which carries product ids and nothing else.
 *
 * So dates have to be asked for, product by product. The saving grace is that
 * the answer keeps: once we hold a product's date, deciding whether it belongs
 * in this month's window is a question for our own database.
 *
 * Two endpoints can answer. Microsoft's display catalogue is used rather than
 * the storefront's own, because it takes 200 ids per request against the
 * other's 20 — a tenfold difference in how often we knock — and it answers with
 * more besides: full descriptions and a dozen screenshots where the storefront
 * gives a sentence and none.
 */
class XboxCatalog
{
    use TalksToStores;

    private const CATALOG = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

    /**
     * Microsoft's correlation vector. The endpoint refuses a request without
     * one and does not care what it says.
     */
    private const CV = 'DGU1mcuYo0WMMp+F.1';

    /**
     * Every product id in the store.
     *
     * Fifteen gzipped sitemaps of about 3,500 entries each. They are read one
     * at a time and thrown away, because decompressed they are 30 MB apiece and
     * all we want from them is a twelve-character id.
     *
     * @return array<int,string>
     *
     * @throws TransientFailure
     */
    public function productIds(): array
    {
        $ids = [];

        foreach ($this->sitemaps() as $url) {
            foreach ($this->idsIn($url) as $id) {
                $ids[$id] = true;
            }
        }

        Log::info('xbox sitemap walked', ['products' => count($ids)]);

        return array_keys($ids);
    }

    /**
     * Full records for a batch of ids, keyed by id.
     *
     * @param  array<int,string>  $ids
     * @return array<string,array>
     *
     * @throws TransientFailure
     */
    public function details(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        try {
            $response = $this->http(60)->get(self::CATALOG, [
                'bigIds' => implode(',', array_values($ids)),
                'market' => 'US',
                'languages' => 'en-us',
                'MS-CV' => self::CV,
            ]);
        } catch (ConnectionException $e) {
            throw new TransientFailure('xbox unreachable: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new TransientFailure('xbox answered '.$response->status());
        }

        $out = [];

        foreach ($response->json('Products') ?? [] as $product) {
            $shaped = $this->present($product);

            if ($shaped !== null) {
                $out[$shaped['store_id']] = $shaped;
            }
        }

        return $out;
    }

    /** @return array<int,string> */
    private function sitemaps(): array
    {
        try {
            $index = $this->http(30)->get(config('releases.xbox.sitemap_index'));
        } catch (ConnectionException $e) {
            throw new TransientFailure('xbox sitemap unreachable: '.$e->getMessage());
        }

        if (! $index->successful()) {
            throw new TransientFailure('xbox sitemap answered '.$index->status());
        }

        preg_match_all('#<loc>([^<]+)</loc>#', $index->body(), $m);

        $pattern = config('releases.xbox.sitemap_pattern');

        return array_values(array_filter($m[1] ?? [], fn (string $u) => str_contains($u, $pattern)));
    }

    /** @return array<int,string> */
    private function idsIn(string $url): array
    {
        try {
            $response = $this->http(90)->get($url);
        } catch (ConnectionException $e) {
            throw new TransientFailure('xbox sitemap unreachable: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new TransientFailure('xbox sitemap answered '.$response->status());
        }

        $xml = @gzdecode($response->body()) ?: $response->body();

        preg_match_all('#/([0-9A-Z]{12})</loc>#', $xml, $m);

        unset($xml);

        return $m[1] ?? [];
    }

    /**
     * One catalogue record in the shape the rest of the pipeline reads.
     *
     * Undated products are dropped here rather than carried: without a date
     * there is nothing to place on a calendar and nothing to compare a window
     * against, and Xbox has plenty of them.
     */
    private function present(array $product): ?array
    {
        $id = $product['ProductId'] ?? null;
        $local = $product['LocalizedProperties'][0] ?? [];
        $market = $product['MarketProperties'][0] ?? [];
        $properties = $product['Properties'] ?? [];

        $title = trim((string) ($local['ProductTitle'] ?? ''));
        $released = $market['OriginalReleaseDate'] ?? null;

        if (! $id || $title === '' || ! $released) {
            return null;
        }

        $images = collect($local['Images'] ?? [])->groupBy('ImagePurpose');
        $screenshots = $images->get('Screenshot', collect())
            ->pluck('Uri')->filter()->map(fn (string $u) => $this->absolute($u))->values()->all();

        return [
            'store_id' => (string) $id,
            'title' => $title,
            'anchor' => Carbon::parse($released)->startOfDay(),
            'precision' => 'day',
            'url' => 'https://www.xbox.com/en-US/games/store/_/'.$id,

            'type' => $this->kind($product, $properties),
            'description' => trim((string) ($local['ProductDescription'] ?? $local['ShortDescription'] ?? '')),
            'hero' => $this->hero($images),
            'publisher' => $local['PublisherName'] ?? null,
            'developer' => $local['DeveloperName'] ?? null,
            'genres' => array_values(array_filter((array) ($properties['Categories'] ?? []))),
            'platforms' => $this->platforms($product, $properties),
            'metacritic' => null,

            'screenshots' => count($screenshots),
            'screenshot_urls' => $screenshots,
            'has_trailer' => false,
            'trailer_urls' => [],

            'adult' => $this->isAdult((array) ($market['ContentRatings'] ?? [])),
        ];
    }

    /** Xbox calls DLC "Durable"; demos carry their own flag. */
    private function kind(array $product, array $properties): string
    {
        if ($properties['IsDemo'] ?? false) {
            return 'demo';
        }

        $kind = (string) ($product['ProductKind'] ?? 'unknown');

        return $kind === 'Game' ? 'game' : mb_strtolower($kind);
    }

    /** The widest key art available, which is the shape a calendar card wants. */
    private function hero(Collection $images): ?string
    {
        foreach (['SuperHeroArt', 'TitledHeroArt', 'BrandedKeyArt', 'Poster', 'BoxArt'] as $purpose) {
            $uri = $images->get($purpose, collect())->pluck('Uri')->filter()->first();

            if ($uri) {
                return $this->absolute($uri);
            }
        }

        return null;
    }

    /**
     * Which boxes it runs on, read from the packages rather than guessed from
     * the store it was found in.
     */
    private function platforms(array $product, array $properties): array
    {
        $names = [];

        foreach ($product['DisplaySkuAvailabilities'] ?? [] as $availability) {
            foreach ($availability['Sku']['Properties']['Packages'] ?? [] as $package) {
                foreach ($package['PlatformDependencies'] ?? [] as $dependency) {
                    $names[] = match ($dependency['PlatformName'] ?? '') {
                        'Windows.Xbox' => ($properties['XboxConsoleGenOptimized'] ?? null) ? 'Xbox Series X|S' : 'Xbox',
                        'Windows.Desktop' => 'PC',
                        default => null,
                    };
                }
            }
        }

        $names = array_values(array_unique(array_filter($names)));

        return $names ?: ['Xbox'];
    }

    /**
     * Ratings arrive as codes from a dozen boards at once — "ESRB:SexCon",
     * "PEGI:18" — so this matches on the substrings that actually mean adult
     * content. Deliberately narrow: a Mature rating is carried by most of the
     * year's biggest games and says nothing about whether one belongs on a
     * release calendar.
     *
     * @param  array<int,array>  $ratings
     */
    private function isAdult(array $ratings): bool
    {
        $flags = config('releases.adult.xbox_descriptors', []);

        $text = mb_strtolower(collect($ratings)
            ->flatMap(fn (array $r) => array_merge([$r['RatingId'] ?? ''], (array) ($r['RatingDescriptors'] ?? [])))
            ->implode(' '));

        if ($text === '') {
            return false;
        }

        foreach ($flags as $flag) {
            if (str_contains($text, mb_strtolower($flag))) {
                return true;
            }
        }

        return false;
    }

    /** Catalogue image uris come protocol-relative. */
    private function absolute(string $uri): string
    {
        return str_starts_with($uri, '//') ? 'https:'.$uri : $uri;
    }
}
