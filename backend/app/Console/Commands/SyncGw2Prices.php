<?php

namespace App\Console\Commands;

use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2RateLimited;
use App\Services\Gw2\Gw2Unavailable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Refresh trading post prices.
 *
 * Measured on 30 September 2026: `/v2/commerce/prices` lists 27,997 tradable
 * item ids out of the catalogue's 74,265, which is about 140 requests at the
 * 200 ids the API accepts per call. Nightly, that is a third of one minute's
 * budget.
 *
 * ── Why nightly and not every ten minutes ──────────────────────────────
 *
 * §19 suggests 2–10 minutes for prices, and that cadence is right for a trading
 * tool. This is not one. A crafting planner answers "what do I still need and
 * roughly what will it cost" — a question a price from this morning answers
 * perfectly well, and one where a stale figure is visibly stale because every
 * page carries the timestamp.
 *
 * Refreshing 27,997 prices every ten minutes would be 20,000 requests a day
 * against a budget shared with every account sync, to move a number most
 * readers will not act on within the hour.
 *
 * ── The bucket rule ────────────────────────────────────────────────────
 *
 * An item absent from this endpoint is not free. §13.2 forbids collapsing
 * account-bound and time-gated requirements into a gold total, and this
 * endpoint is the authority on which is which: if it is not here, it cannot be
 * bought, and a planner has to say so rather than count it as zero.
 */
class SyncGw2Prices extends Command
{
    protected $signature = 'gw2:prices {--limit= : Stop after this many ids, for a quick check}';

    protected $description = 'Refresh Guild Wars 2 trading post prices';

    public function handle(Gw2Client $api): int
    {
        try {
            $ids = $api->public('commerce/prices');
        } catch (Gw2Unavailable $e) {
            /*
             * Not a failure worth alerting on. Yesterday's prices are still
             * roughly right and every page that shows one says when it was
             * taken — which is precisely why the timestamp exists.
             */
            $this->warn('The trading post is not answering: '.$e->getMessage());

            return self::SUCCESS;
        }

        if ($limit = (int) $this->option('limit')) {
            $ids = array_slice($ids, 0, $limit);
        }

        $this->line(number_format(count($ids)).' tradable items');

        $bar = $this->output->createProgressBar(count($ids));
        $bar->start();

        $written = 0;
        $observedAt = now();

        foreach (array_chunk($ids, Gw2Client::BATCH) as $chunk) {
            try {
                $rows = $api->public('commerce/prices', ['ids' => implode(',', $chunk)]);
            } catch (Gw2RateLimited) {
                // Nothing else will get through this minute either, and a
                // partial refresh is fine: every row carries its own timestamp.
                $bar->finish();
                $this->newLine();
                $this->warn('Budget spent — stopping here. The rows written keep their own observed_at.');
                break;
            } catch (Gw2Unavailable $e) {
                $this->newLine();
                $this->warn('  '.$e->getMessage());

                continue;
            }

            $written += $this->store($rows, $observedAt);
            $bar->advance(count($chunk));
        }

        $bar->finish();
        $this->newLine(2);

        $this->info(number_format($written).' prices written.');

        $stale = DB::table('gw2_item_prices')->where('observed_at', '<', now()->subDays(3))->count();

        if ($stale > 0) {
            $this->line("<fg=gray>{$stale} rows are older than three days — the pages that show them say so.</>");
        }

        return self::SUCCESS;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function store(array $rows, \DateTimeInterface $observedAt): int
    {
        $values = [];

        foreach ($rows as $row) {
            if (! isset($row['id'])) {
                continue;
            }

            $values[] = [
                'item_id' => (int) $row['id'],
                'buy_unit' => $row['buys']['unit_price'] ?? null,
                'buy_quantity' => $row['buys']['quantity'] ?? 0,
                'sell_unit' => $row['sells']['unit_price'] ?? null,
                'sell_quantity' => $row['sells']['quantity'] ?? 0,
                'observed_at' => $observedAt,
            ];
        }

        if ($values === []) {
            return 0;
        }

        DB::table('gw2_item_prices')->upsert(
            $values,
            ['item_id'],
            ['buy_unit', 'buy_quantity', 'sell_unit', 'sell_quantity', 'observed_at']
        );

        return count($values);
    }
}
