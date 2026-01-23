<?php

namespace App\Console\Commands;

use App\Models\AdCampaign;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class SyncAdMetrics extends Command
{
    protected $signature = 'ads:sync-metrics';
    protected $description = 'Sync ad view and click counts from Redis to database';

    public function handle()
    {
        $this->info('Starting ad metrics synchronization...');

        $ads = AdCampaign::all();
        $totalViews = 0;
        $totalClicks = 0;

        foreach ($ads as $ad) {
            $viewKey = "views:ad:{$ad->id}";
            $clickKey = "clicks:ad:{$ad->id}";

            // Get counts from Redis
            $views = (int) Redis::get($viewKey);
            $clicks = (int) Redis::get($clickKey);

            if ($views > 0 || $clicks > 0) {
                // Increment database counters
                $ad->increment('view_count', $views);
                $ad->increment('click_count', $clicks);

                // Clear Redis keys after successful sync
                Redis::del($viewKey);
                Redis::del($clickKey);

                $totalViews += $views;
                $totalClicks += $clicks;

                $this->line("  - {$ad->name}: +{$views} views, +{$clicks} clicks");
            }
        }

        $this->info("Sync complete! Total synced: {$totalViews} views, {$totalClicks} clicks");

        return Command::SUCCESS;
    }
}
