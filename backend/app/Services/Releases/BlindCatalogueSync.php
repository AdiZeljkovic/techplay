<?php

namespace App\Services\Releases;

use App\Models\GameStoreLink;
use Illuminate\Support\Carbon;

/**
 * For stores that will not say what is coming out.
 *
 * Steam and Nintendo name a date in their listings, so filtering to a window
 * costs nothing. Xbox and PlayStation do not: their indexes carry identifiers
 * and nothing else, and the only way to learn a release date is to ask about
 * each product in turn.
 *
 * Doing that once is affordable. Doing it every week would not be, so every
 * answer is kept — including for products that fall outside the window, which
 * get a row carrying their date and nothing more. A window rolling forward into
 * next quarter is then a question for our own tables, and the store is asked
 * only about identifiers its index has gained since.
 */
abstract class BlindCatalogueSync extends StoreSync
{
    /** A product we have asked about whose date is not in this window — yet. */
    public const OUT_OF_WINDOW = 'outside the window';

    /** Records fetched during discovery, keyed by store id. */
    protected array $loaded = [];

    /**
     * Every identifier the store's index carries.
     *
     * @return array<int,string>
     */
    abstract protected function allProductIds(): array;

    /**
     * Full records for identifiers we have never seen, keyed by id.
     *
     * @param  array<int,string>  $ids
     * @param  ?\Closure  $progress  called with how many have been asked about
     * @return array<string,array>
     */
    abstract protected function fetchDetails(array $ids, ?\Closure $progress = null): array;

    /** Where the store's own page for a product lives. */
    abstract protected function productUrl(string $id): string;

    /** Discovery does the work; nothing here is per-title afterwards. */
    protected function delayMs(): int
    {
        return 0;
    }

    /**
     * A product parked as out of window is not a judgement about the game, only
     * about the calendar. When its date comes round it deserves reconsidering.
     */
    protected function retryable(): array
    {
        return [self::UNREACHABLE, self::OUT_OF_WINDOW];
    }

    protected function discover(Carbon $from, Carbon $to): array
    {
        $ids = $this->allProductIds();

        // What the store has already told us, so we never pay for it twice.
        $known = GameStoreLink::where('store', $this->store())->pluck('payload', 'store_id');

        $unknown = array_values(array_filter($ids, fn (string $id) => ! $known->has($id)));

        $this->report('index lists '.count($ids).' products, '.count($unknown).' of them new');

        $this->loaded = $this->fetchDetails(
            $unknown,
            fn (int $done) => $this->report("asked about {$done} of ".count($unknown)),
        );

        $rows = [];
        $parked = [];

        // Newly asked-about products: keep the ones in range, file the rest
        // away with their date so this pass never repeats for them.
        foreach ($this->loaded as $row) {
            if ($row['anchor']->betweenIncluded($from, $to)) {
                $rows[] = $row;

                continue;
            }

            $parked[] = $row;
        }

        $this->park($parked);

        // Products we already hold: the window may have moved onto them, and
        // answering that costs nothing but a date comparison.
        foreach ($known as $id => $payload) {
            $released = $payload['released'] ?? null;

            if (! $released || ! Carbon::parse($released)->betweenIncluded($from, $to)) {
                continue;
            }

            $rows[] = [
                'store_id' => (string) $id,
                'title' => $payload['title'] ?? '',
                'anchor' => Carbon::parse($released)->startOfDay(),
                'precision' => 'day',
                'url' => $this->productUrl((string) $id),
            ];
        }

        return $rows;
    }

    protected function details(array $row): ?array
    {
        if (isset($this->loaded[$row['store_id']])) {
            return $this->loaded[$row['store_id']];
        }

        // A parked product coming into range: we kept its date, not its whole
        // record, so this is the one place it is fetched a second time.
        $fresh = $this->fetchDetails([$row['store_id']]);

        return $fresh[$row['store_id']] ?? null;
    }

    /**
     * Remember products that exist but are not due in this window.
     *
     * Written in bulk. A first pass parks tens of thousands of rows, and doing
     * that one statement at a time took longer than fetching them had.
     *
     * @param  array<int,array>  $rows
     */
    protected function park(array $rows): void
    {
        if ($rows === []) {
            return;
        }

        $now = now();

        foreach (array_chunk($rows, 500) as $chunk) {
            GameStoreLink::upsert(
                array_map(fn (array $row) => [
                    'store' => $this->store(),
                    'store_id' => $row['store_id'],
                    'game_id' => null,
                    'url' => $row['url'],
                    'rejected_reason' => self::OUT_OF_WINDOW,
                    'payload' => json_encode([
                        'title' => $row['title'],
                        'released' => $row['anchor']->toDateString(),
                    ]),
                    'last_synced_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], $chunk),
                ['store', 'store_id'],
                ['payload', 'rejected_reason', 'url', 'last_synced_at', 'updated_at'],
            );
        }

        $this->report('parked '.count($rows).' products outside the window');
    }

    /** Progress from inside discovery, which is where these stores spend their time. */
    protected function report(string $message): void
    {
        if ($this->onProgress) {
            ($this->onProgress)($message);
        }
    }
}
