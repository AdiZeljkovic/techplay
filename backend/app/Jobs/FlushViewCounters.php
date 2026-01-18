<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

/**
 * Flush view counters from Redis to database.
 * This job should be scheduled to run every 5 minutes.
 */
class FlushViewCounters implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $this->flushThreadViews();
        $this->flushArticleViews();
        $this->flushAdViews();
    }

    /**
     * Flush thread view counts
     */
    protected function flushThreadViews(): void
    {
        $keys = Redis::keys('views:thread:*');

        foreach ($keys as $key) {
            // Extract thread ID from key
            $threadId = str_replace('views:thread:', '', $key);
            $threadId = str_replace(config('database.redis.options.prefix', ''), '', $threadId);

            $count = (int) Redis::get($key);

            if ($count > 0) {
                DB::table('threads')
                    ->where('id', $threadId)
                    ->increment('view_count', $count);

                Redis::del($key);
            }
        }
    }

    /**
     * Flush article view counts
     */
    protected function flushArticleViews(): void
    {
        $keys = Redis::keys('views:article:*');

        foreach ($keys as $key) {
            $articleId = str_replace('views:article:', '', $key);
            $articleId = str_replace(config('database.redis.options.prefix', ''), '', $articleId);

            $count = (int) Redis::get($key);

            if ($count > 0) {
                DB::table('articles')
                    ->where('id', $articleId)
                    ->increment('views', $count);

                Redis::del($key);
            }
        }
    }

    /**
     * Flush ad view/click counts
     */
    protected function flushAdViews(): void
    {
        // Flush view counts
        $viewKeys = Redis::keys('views:ad:*');
        foreach ($viewKeys as $key) {
            $adId = str_replace('views:ad:', '', $key);
            $adId = str_replace(config('database.redis.options.prefix', ''), '', $adId);

            $count = (int) Redis::get($key);
            if ($count > 0) {
                DB::table('ad_campaigns')
                    ->where('id', $adId)
                    ->increment('view_count', $count);
                Redis::del($key);
            }
        }

        // Flush click counts
        $clickKeys = Redis::keys('clicks:ad:*');
        foreach ($clickKeys as $key) {
            $adId = str_replace('clicks:ad:', '', $key);
            $adId = str_replace(config('database.redis.options.prefix', ''), '', $adId);

            $count = (int) Redis::get($key);
            if ($count > 0) {
                DB::table('ad_campaigns')
                    ->where('id', $adId)
                    ->increment('click_count', $count);
                Redis::del($key);
            }
        }
    }
}
