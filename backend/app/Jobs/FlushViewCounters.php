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
        $this->flushPattern('views:guide:*', 'guides', 'views');
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
                $id = (int) substr($key, strrpos($key, ':') + 1);

                if ($id <= 0) {
                    continue;
                }

                // Read and clear in one step. Reading, writing and then
                // deleting lost every view recorded in between — exactly when
                // a page is busiest — and re-applied the whole counter if the
                // worker died before the delete.
                $count = (int) Redis::getdel($key);

                if ($count <= 0) {
                    continue;
                }

                try {
                    DB::table($table)->where('id', $id)->increment($column, $count);
                } catch (\Throwable $e) {
                    // Put it back rather than lose it.
                    Redis::incrby($key, $count);
                    throw $e;
                }
            }
        } while ($cursor !== '0');
    }
}
