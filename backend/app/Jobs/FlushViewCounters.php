<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * Flush view counters from Redis to database.
 * Uses SCAN instead of KEYS to avoid blocking Redis on large keyspaces.
 */
class FlushViewCounters implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $this->flushPattern('views:thread:*', 'threads', 'view_count');
        $this->flushPattern('views:article:*', 'articles', 'views');
        $this->flushPattern('views:game:*', 'games', 'views');
        $this->flushPattern('views:ad:*', 'ad_campaigns', 'view_count');
        $this->flushPattern('clicks:ad:*', 'ad_campaigns', 'click_count');
    }

    private function flushPattern(string $pattern, string $table, string $column): void
    {
        $prefix = config('database.redis.options.prefix', '');
        $cursor = '0';

        do {
            [$cursor, $keys] = Redis::scan($cursor, ['match' => $pattern, 'count' => 100]);

            if (empty($keys)) {
                continue;
            }

            foreach ($keys as $key) {
                $count = (int) Redis::get($key);

                if ($count <= 0) {
                    continue;
                }

                // Strip Redis prefix to get the raw ID
                $id = str_replace([$prefix, ltrim($pattern, '*'), ':'], '', $key);
                // More reliable: extract the last segment after the last colon
                $id = (int) substr($key, strrpos($key, ':') + 1);

                if ($id <= 0) {
                    continue;
                }

                DB::table($table)->where('id', $id)->increment($column, $count);
                Redis::del($key);
            }
        } while ($cursor !== '0');
    }
}
