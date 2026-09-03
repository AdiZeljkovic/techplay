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
        $this->flushPattern('views:help:*', 'help_articles', 'views');

        // Helpfulness is buffered like a view and for the same reason: it is
        // an anonymous click on a page that may be getting a lot of them at
        // once, and an UPDATE per click serialises on the row.
        $this->flushPattern('helpful:help:*', 'help_articles', 'helpful_count');
        $this->flushPattern('unhelpful:help:*', 'help_articles', 'unhelpful_count');
        $this->flushPattern('views:ad:*', 'ad_campaigns', 'view_count');
        $this->flushPattern('clicks:ad:*', 'ad_campaigns', 'click_count');
    }

    /**
     * Two faults, both of which made this find nothing at all.
     *
     * **The prefix.** SCAN talks to Redis directly and sees the real key names,
     * which carry the connection's prefix — `techplay-database-views:game:41` —
     * while GETDEL goes through Laravel, which adds that prefix itself. The
     * pattern was written without it. The prefix was even read into a variable
     * on the first line and then never used.
     *
     * **The wrapper.** `Redis::scan()` returns `false` when a batch comes back
     * empty, and with phpredis an empty batch mid-iteration is routine, not an
     * ending. Destructuring `false` gave a null cursor, so the loop stopped on
     * the first pass. Measured against production: the wrapper found 0 keys;
     * the raw client with SCAN_RETRY found 128,866 under the same pattern.
     *
     * The consequence, measured 17 Aug 2026: **130,861** `views:game:*` keys in
     * Redis, none with an expiry, and `SUM(games.views)` = **0**. Every view of
     * every game since these counters were introduced had been recorded into
     * Redis and never written down, while the keys accumulated one per game
     * viewed on an instance shared with the queue and every session.
     *
     * Nothing errored throughout. A flush that finds nothing looks exactly like
     * a flush with nothing to do.
     */
    private function flushPattern(string $pattern, string $table, string $column): void
    {
        $prefix = (string) config('database.redis.options.prefix', '');
        $connection = Redis::connection();
        $client = $connection->client();

        // Not every client is phpredis — Predis has no such option and its own
        // scan does not need one.
        if ($client instanceof \Redis) {
            $client->setOption(\Redis::OPT_SCAN, \Redis::SCAN_RETRY);

            $iterator = null;

            while (($keys = $client->scan($iterator, $prefix.$pattern, 500)) !== false) {
                $this->drain($keys, $prefix, $table, $column);
            }

            return;
        }

        $cursor = '0';

        do {
            $result = $connection->scan($cursor, ['match' => $prefix.$pattern, 'count' => 500]);

            if ($result === false) {
                break;
            }

            [$cursor, $keys] = $result;
            $this->drain($keys ?: [], $prefix, $table, $column);
        } while ((string) $cursor !== '0');
    }

    /**
     * @param  array<int, string>  $keys  as Redis names them, prefix included
     */
    private function drain(array $keys, string $prefix, string $table, string $column): void
    {
        foreach ($keys as $key) {
            $id = (int) substr($key, strrpos($key, ':') + 1);

            if ($id <= 0) {
                continue;
            }

            // Back to the unprefixed name: everything below goes through
            // Laravel, and Laravel adds the prefix itself.
            $name = $prefix !== '' && str_starts_with($key, $prefix)
                ? substr($key, strlen($prefix))
                : $key;

            // Read and clear in one step. Reading, writing and then deleting
            // lost every view recorded in between — exactly when a page is
            // busiest — and re-applied the whole counter if the worker died
            // before the delete.
            $count = (int) Redis::getdel($name);

            if ($count <= 0) {
                continue;
            }

            try {
                DB::table($table)->where('id', $id)->increment($column, $count);
            } catch (Throwable $e) {
                // Put it back rather than lose it.
                Redis::incrby($name, $count);
                throw $e;
            }
        }
    }
}
