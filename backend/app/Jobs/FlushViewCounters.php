<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Throwable;

/**
 * Flush view counters from Redis to database.
 * Uses SCAN instead of KEYS to avoid blocking Redis on large keyspaces.
 */
class FlushViewCounters implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Runs again in five minutes and the counters wait in Redis until a pass succeeds, so retrying a stuck flush would only stack workers. */
    public int $tries = 1;

    /** A queue job that dies quietly is a job nobody knows stopped. */
    public function failed(Throwable $e): void
    {
        Log::error('FlushViewCounters failed', ['error' => $e->getMessage()]);
    }

    public function handle(): void
    {
        $this->flushPattern('views:thread:*', 'threads', 'view_count');
        $this->flushPattern('views:article:*', 'articles', 'views');
        $this->flushPattern('views:game:*', 'games', 'views');
        $this->flushPattern('views:guide:*', 'guides', 'views');
        $this->flushPattern('views:ad:*', 'ad_campaigns', 'view_count');
        $this->flushPattern('clicks:ad:*', 'ad_campaigns', 'click_count');
    }

    /**
     * The prefix is the whole job.
     *
     * SCAN talks to Redis directly and sees the real key names, which carry the
     * connection's prefix: `techplay-database-views:game:41`. GETDEL goes
     * through Laravel, which adds that prefix itself. So a pattern written
     * without it matches nothing, and a key passed back with it gets the prefix
     * twice and deletes something that does not exist.
     *
     * This code read the prefix into a variable and then never used it. The
     * result, measured on 17 Aug 2026: 130,861 `views:game:*` keys in Redis, not
     * one of them with an expiry, and `SUM(games.views)` = **0**. Every view of
     * every game since the counters were introduced had been counted into Redis
     * and never written anywhere. Nothing failed; the flush simply never found
     * anything to flush, five minutes at a time.
     */
    private function flushPattern(string $pattern, string $table, string $column): void
    {
        $prefix = (string) config('database.redis.options.prefix', '');
        $cursor = '0';

        do {
            [$cursor, $keys] = Redis::scan($cursor, ['match' => $prefix.$pattern, 'count' => 100]);

            if (empty($keys)) {
                continue;
            }

            foreach ($keys as $key) {
                $id = (int) substr($key, strrpos($key, ':') + 1);

                // Back to the unprefixed name, because everything below goes
                // through Laravel and Laravel prefixes for us.
                $key = $prefix !== '' && str_starts_with($key, $prefix)
                    ? substr($key, strlen($prefix))
                    : $key;

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
                } catch (Throwable $e) {
                    // Put it back rather than lose it.
                    Redis::incrby($key, $count);
                    throw $e;
                }
            }
        } while ($cursor !== '0');
    }
}
