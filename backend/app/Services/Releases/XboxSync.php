<?php

namespace App\Services\Releases;

use App\Models\GameStoreLink;
use Illuminate\Support\Carbon;

/**
 * Xbox, whose catalogue has to be asked about before it can be filtered.
 *
 * Everywhere else the listing names a date and the window filter is free. Xbox
 * gives ids and nothing more, so the only way to learn that a product is out of
 * range is to ask — which would be ruinous if we asked twice.
 *
 * So we do not. Every product Xbox has ever told us about keeps a row, dated,
 * whether or not it belonged in the window at the time. A first pass costs the
 * whole catalogue; every pass afterwards costs only what the sitemap has gained
 * since, and a window rolling forward into next quarter is answered entirely
 * from our own tables.
 */
class XboxSync extends StoreSync
{
    public const STORE = 'xbox';

    /** A product we have asked about whose date is not in this window — yet. */
    public const OUT_OF_WINDOW = 'outside the window';

    /** Titles fetched during discovery, keyed by store id. */
    private array $loaded = [];

    public function __construct(
        private XboxCatalog $catalog,
        QualityFilter $filter,
        TitleNormalizer $normalizer,
    ) {
        parent::__construct($filter, $normalizer);
    }

    public function store(): string
    {
        return self::STORE;
    }

    /** Discovery does the batching; nothing here is per-title. */
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
        $ids = $this->catalog->productIds();

        // What Xbox has already told us, so we never pay for it twice.
        $known = GameStoreLink::where('store', self::STORE)
            ->pluck('payload', 'store_id');

        $unknown = array_values(array_filter($ids, fn (string $id) => ! $known->has($id)));

        $this->report('sitemap lists '.count($ids).' products, '.count($unknown).' of them new');

        $this->loaded = $this->fetch($unknown);
        $rows = [];
        $parked = [];

        // Newly asked-about products: keep the ones in range, and file the rest
        // away with their date so this pass never repeats for them.
        foreach ($this->loaded as $id => $row) {
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
                'url' => 'https://www.xbox.com/en-US/games/store/_/'.$id,
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
        $fresh = $this->catalog->details([$row['store_id']]);

        return $fresh[$row['store_id']] ?? null;
    }

    protected function platformNames(array $row, array $details): array
    {
        return $details['platforms'] ?? ['Xbox'];
    }

    /**
     * Ask Xbox about ids we have never seen, in batches.
     *
     * @param  array<int,string>  $ids
     * @return array<string,array>
     */
    private function fetch(array $ids): array
    {
        $batch = (int) config('releases.xbox.batch');
        $chunks = array_chunk($ids, $batch);
        $out = [];

        foreach ($chunks as $i => $chunk) {
            foreach ($this->catalog->details($chunk) as $id => $row) {
                $out[$id] = $row;
            }

            // Discovery is the entire job for this store, so it has to say so
            // while it happens rather than after.
            if ($i % 10 === 9 || $i === count($chunks) - 1) {
                $this->report(sprintf('asked about %d of %d products', min(($i + 1) * $batch, count($ids)), count($ids)));
            }
        }

        return $out;
    }

    /**
     * Remember products that exist but are not due in this window, so the next
     * pass can rule on them without asking Microsoft again.
     *
     * Written in bulk. A first pass parks tens of thousands of rows, and doing
     * that one statement at a time took longer than fetching them had.
     *
     * @param  array<int,array>  $rows
     */
    private function park(array $rows): void
    {
        if ($rows === []) {
            return;
        }

        $now = now();

        foreach (array_chunk($rows, 500) as $chunk) {
            GameStoreLink::upsert(
                array_map(fn (array $row) => [
                    'store' => self::STORE,
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

    /** Progress from inside discovery, which is where this store spends its time. */
    private function report(string $message): void
    {
        if ($this->onProgress) {
            ($this->onProgress)($message);
        }
    }
}
