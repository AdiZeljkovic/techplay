<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Clean Old View Tracking Records
 *
 * PERFORMANCE: Prevents view tracking tables from growing indefinitely
 * Runs daily via scheduler to delete records older than 7 days
 */
class CleanOldViewTracking extends Command
{
    protected $signature = 'views:clean {--days=7 : Number of days to keep}';
    protected $description = 'Clean old view tracking records from database';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("Cleaning view tracking records older than {$days} days...");

        try {
            // Clean article views
            $articleDeleted = DB::table('article_views')
                ->where('created_at', '<', $cutoffDate)
                ->delete();

            $this->line("Deleted {$articleDeleted} article view records");

            // Clean guide views
            $guideDeleted = DB::table('guide_views')
                ->where('created_at', '<', $cutoffDate)
                ->delete();

            $this->line("Deleted {$guideDeleted} guide view records");

            // Clean review views
            $reviewDeleted = DB::table('review_views')
                ->where('created_at', '<', $cutoffDate)
                ->delete();

            $this->line("Deleted {$reviewDeleted} review view records");

            $total = $articleDeleted + $guideDeleted + $reviewDeleted;
            $this->info("Total: Cleaned {$total} old view tracking records ✓");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to clean view tracking records: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }
}
