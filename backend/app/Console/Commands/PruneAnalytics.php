<?php

namespace App\Console\Commands;

use App\Models\AnalyticsEvent;
use Illuminate\Console\Command;

/**
 * Throws away the detail once the totals have been taken.
 *
 * Ninety days is long enough to answer "what happened that week" and short
 * enough that the table stays a working set rather than an archive. The daily
 * rollups are what the reports read past that, and they are kept forever.
 *
 * Deleted in batches because a single DELETE across a few million rows takes a
 * lock for as long as it takes, and this runs on the same database the site is
 * being served from.
 */
class PruneAnalytics extends Command
{
    protected $signature = 'analytics:prune {--days=90}';

    protected $description = 'Delete raw analytics hits older than the retention window';

    public function handle(): int
    {
        $cutoff = now()->subDays((int) $this->option('days'))->startOfDay();
        $removed = 0;

        do {
            $batch = AnalyticsEvent::where('occurred_at', '<', $cutoff)->limit(5000)->delete();
            $removed += $batch;
        } while ($batch > 0);

        $this->info("Pruned {$removed} hits older than {$cutoff->toDateString()}.");

        return self::SUCCESS;
    }
}
