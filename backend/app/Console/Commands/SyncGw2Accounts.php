<?php

namespace App\Console\Commands;

use App\Jobs\SyncGw2Account;
use App\Models\ConnectedAccount;
use App\Services\Gw2\Gw2Connection;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Read every connected Guild Wars 2 account, once a night.
 *
 * The reason this is a scheduled sweep rather than something the dashboard
 * triggers: /v2/account/raids reports only what has been cleared since the
 * weekly reset, and the API has no lifetime view of it anywhere. Miss the read
 * and that week is gone for good — nothing can reconstruct it later. The same
 * goes for the daily endpoints. These snapshots are the only record of a
 * player's history that will ever exist, and a player who does not open the
 * page still expects their history to be there when they do.
 *
 * Staggered rather than dispatched in one go. A full read is eighteen requests
 * and the rate limit is counted per IP for the whole site, so fifty accounts
 * released at once would spend the budget, take a wave of 429s, and come back
 * through the backoff a quarter of an hour later. Spacing them costs nothing at
 * 3am.
 */
class SyncGw2Accounts extends Command
{
    protected $signature = 'gw2:sync-accounts
        {--quick : Read only the six endpoints that move within a day}
        {--force : Include accounts already read inside the window}';

    protected $description = 'Queue a Guild Wars 2 account read for every connected player';

    /**
     * Seconds between dispatches.
     *
     * Eighteen requests per account against a budget of 400 a minute means
     * twelve accounts a minute is around half the allowance — enough headroom
     * that somebody connecting a key at 3am is not queued behind the sweep.
     */
    private const SPACING = 5;

    /**
     * Don't re-read an account that was read this recently.
     *
     * Twenty hours, not twenty-four: a nightly task that drifts by a few
     * minutes would otherwise start skipping every other night.
     */
    private const WINDOW_HOURS = 20;

    public function handle(): int
    {
        $quick = (bool) $this->option('quick');

        $connections = ConnectedAccount::query()
            ->where('provider', Gw2Connection::PROVIDER)
            ->orderBy('id')
            ->get();

        if ($connections->isEmpty()) {
            $this->line('No Guild Wars 2 accounts are connected.');

            return self::SUCCESS;
        }

        $column = $quick ? 'last_quick_sync_at' : 'last_full_sync_at';
        $cutoff = now()->subHours(self::WINDOW_HOURS);

        $queued = 0;
        $skipped = 0;

        foreach ($connections as $connection) {
            $last = DB::table('gw2_accounts')
                ->where('connected_account_id', $connection->id)
                ->value($column);

            if (! $this->option('force') && $last && $last > $cutoff) {
                $skipped++;

                continue;
            }

            SyncGw2Account::dispatch($connection->id, quick: $quick)
                ->delay(now()->addSeconds($queued * self::SPACING));

            $queued++;
        }

        $this->line(sprintf(
            '%s read queued for %d account%s%s.',
            $quick ? 'Quick' : 'Full',
            $queued,
            $queued === 1 ? '' : 's',
            $skipped > 0 ? ", {$skipped} already read inside the window" : ''
        ));

        return self::SUCCESS;
    }
}
