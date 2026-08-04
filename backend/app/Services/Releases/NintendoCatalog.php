<?php

namespace App\Services\Releases;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;

/**
 * Reads Nintendo's eShop.
 *
 * The opposite of Steam in every way that matters here. One request returns the
 * entire window — title, date, art, publisher, genres and all — so there is no
 * second call to make and nothing to pace. It is also the only source for
 * Switch exclusives, which Steam by definition never carries.
 *
 * The endpoint is the Solr index behind Nintendo's European store, which is why
 * the query language looks the way it does.
 */
class NintendoCatalog
{
    use TalksToStores;

    private const SEARCH = 'https://searching.nintendo-europe.com/en/select';

    /** Relative paths in the payload hang off the UK storefront. */
    private const SITE = 'https://www.nintendo.co.uk';

    /** Comfortably above a full window; the eShop ships ~180 titles a quarter. */
    private const MAX_ROWS = 1000;

    /**
     * Every game the eShop lists between two dates, already complete.
     *
     * @return array<int,array>
     *
     * @throws TransientFailure
     */
    public function listWindow(Carbon $from, Carbon $to): array
    {
        $range = sprintf(
            'dates_released_dts:[%s TO %s]',
            $from->copy()->utc()->format('Y-m-d\TH:i:s\Z'),
            $to->copy()->utc()->format('Y-m-d\TH:i:s\Z'),
        );

        try {
            $response = $this->http()
                ->get(self::SEARCH, [
                    'q' => '*',
                    'fq' => 'type:GAME AND '.$range,
                    'rows' => self::MAX_ROWS,
                    'wt' => 'json',
                    'sort' => 'dates_released_dts asc',
                ]);
        } catch (ConnectionException $e) {
            throw new TransientFailure('nintendo unreachable: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new TransientFailure('nintendo answered '.$response->status());
        }

        return collect($response->json('response.docs') ?? [])
            ->map(fn (array $doc) => $this->present($doc, $from, $to))
            ->filter(fn (?array $row) => $row !== null)
            ->values()
            ->all();
    }

    /**
     * The date this title lands on, for the window we asked about.
     *
     * dates_released_dts is a list, because a game can be released more than
     * once — an original and then a Switch 2 edition, say. Solr matches the
     * document if any of those dates falls in range, so taking the first would
     * file "Lou's Lagoon – Nintendo Switch 2 Edition" under the original
     * July release rather than the one we actually asked about.
     */
    private function releaseIn(array $dates, Carbon $from, Carbon $to): ?Carbon
    {
        $parsed = collect($dates)
            ->filter()
            ->map(fn ($d) => Carbon::parse($d)->startOfDay())
            ->sort();

        return $parsed->first(fn (Carbon $d) => $d->betweenIncluded($from, $to))
            ?? $parsed->first();
    }

    /**
     * The listing is also the detail record, so this shapes both at once: the
     * keys StoreSync writes to a game, and the keys the quality gate reads.
     */
    private function present(array $doc, Carbon $from, Carbon $to): ?array
    {
        $id = $this->storeId($doc);
        $title = trim((string) ($doc['title'] ?? ''));
        $released = $this->releaseIn((array) ($doc['dates_released_dts'] ?? []), $from, $to);

        if ($id === null || $title === '' || $released === null) {
            return null;
        }

        $description = trim((string) ($doc['product_catalog_description_s'] ?? $doc['excerpt'] ?? ''));
        $path = (string) ($doc['url'] ?? '');

        return [
            'store_id' => $id,
            'title' => $title,
            'anchor' => $released,
            // Nintendo commits to a day or does not list the game at all.
            'precision' => 'day',
            'url' => $path === '' ? null : (str_starts_with($path, 'http') ? $path : self::SITE.$path),

            'type' => 'game',
            'description' => $description,
            'hero' => $doc['image_url_h16x9_s'] ?? $doc['image_url_sq_s'] ?? null,
            'publisher' => $doc['publisher'] ?? null,
            'developer' => $doc['developer'] ?? null,
            'genres' => array_values(array_filter((array) ($doc['pretty_game_categories_txt'] ?? []))),
            'platforms' => array_values(array_filter((array) ($doc['system_names_txt'] ?? ['Nintendo Switch']))),

            // The eShop search index carries neither, which is why Nintendo is
            // judged by its own thresholds rather than Steam's.
            'screenshots' => 0,
            'has_trailer' => false,
            'screenshot_urls' => [],
            'trailer_urls' => [],
            'metacritic' => null,

            // Nintendo does not list adult content in the first place.
            'adult' => false,
        ];
    }

    /**
     * The eShop identifies a game two ways. nsuid is the one that means
     * something outside Nintendo's own site, so it is preferred.
     */
    private function storeId(array $doc): ?string
    {
        $nsuid = $doc['nsuid_txt'][0] ?? null;

        if (filled($nsuid)) {
            return (string) $nsuid;
        }

        return filled($doc['fs_id'] ?? null) ? 'fs:'.$doc['fs_id'] : null;
    }
}
