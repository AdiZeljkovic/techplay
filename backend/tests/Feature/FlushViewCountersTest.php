<?php

namespace Tests\Feature;

use App\Jobs\FlushViewCounters;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

/**
 * Views counted into Redis have to reach the database.
 *
 * They did not. SCAN speaks to Redis directly and sees the real key names,
 * which carry the connection prefix — `techplay-database-views:game:41` — while
 * the job searched for `views:game:*`. It matched nothing, five minutes at a
 * time, since the counters were introduced.
 *
 * Measured on production, 17 Aug 2026: **130,861** `views:game:*` keys, none
 * with an expiry, and `SUM(games.views)` = **0**. Every view of every game had
 * been counted and never written down, and Redis was carrying one key per game
 * viewed with nothing to ever remove it — on a 768 MB instance shared with the
 * queue and every logged-in session.
 *
 * Nothing failed while this was happening. That is what makes it worth a test:
 * a flush that finds nothing looks exactly like a flush with nothing to do.
 */
class FlushViewCountersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.redis.client') === null) {
            $this->markTestSkipped('no redis client configured');
        }

        try {
            Redis::connection()->ping();
        } catch (\Throwable) {
            $this->markTestSkipped('redis not reachable');
        }

        /* Clean before, not only after.
         *
         * The database is rebuilt per test and hands out ids from 1 again;
         * Redis is not, and these keys are named after those ids. tearDown
         * below clears them, but a run that dies before it — a failed
         * assertion, an interrupted suite — leaves them for the next one,
         * which then reads 32 where it has just written 7. Starting clean
         * costs one command and does not depend on the previous run having
         * ended tidily.
         *
         * The facade returns keys with the connection prefix already applied
         * and del() applies it again, so it has to come off in between.
         */
        $prefix = (string) config('database.redis.options.prefix');

        foreach (Redis::keys('views:game:*') as $key) {
            Redis::del($prefix !== '' && str_starts_with($key, $prefix) ? substr($key, strlen($prefix)) : $key);
        }
    }

    private function game(string $slug, int $views = 0): Game
    {
        $game = Game::create([
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'description' => 'Present, so the row behaves like a real one.',
        ]);

        /* Not through create(): `views` is guarded, precisely because nothing
           should set it but the counter this test is about. Passing it there
           dropped it silently and started every game at zero — which only
           showed up once Redis was reachable and these tests stopped being
           skipped. */
        if ($views > 0) {
            DB::table('games')->where('id', $game->id)->update(['views' => $views]);
            $game->refresh();
        }

        return $game;
    }

    public function test_a_counter_in_redis_reaches_the_games_table(): void
    {
        $game = $this->game('a-counted-game');

        Redis::incrby("views:game:{$game->id}", 7);

        (new FlushViewCounters)->handle();

        $this->assertSame(7, (int) $game->fresh()->views);
    }

    /**
     * The failure that actually happened: the key survives the flush, so it is
     * counted again on the next pass and forever after.
     */
    public function test_the_key_does_not_survive_the_flush(): void
    {
        $game = $this->game('a-game-that-clears');

        Redis::incrby("views:game:{$game->id}", 3);

        (new FlushViewCounters)->handle();

        $this->assertFalse(
            (bool) Redis::exists("views:game:{$game->id}"),
            'the counter was left in Redis, which is how 130,861 of them accumulated',
        );
    }

    public function test_running_twice_does_not_count_the_same_views_twice(): void
    {
        $game = $this->game('a-game-flushed-twice');

        Redis::incrby("views:game:{$game->id}", 5);

        (new FlushViewCounters)->handle();
        (new FlushViewCounters)->handle();

        $this->assertSame(5, (int) $game->fresh()->views);
    }

    public function test_it_adds_to_whatever_was_already_there(): void
    {
        $game = $this->game('a-game-with-history', 100);

        Redis::incrby("views:game:{$game->id}", 4);

        (new FlushViewCounters)->handle();

        $this->assertSame(104, (int) $game->fresh()->views);
    }

    /**
     * A counter for a row that no longer exists must not stop the pass — one
     * deleted game would otherwise strand every counter behind it.
     */
    public function test_a_counter_for_a_missing_row_does_not_block_the_rest(): void
    {
        $game = $this->game('a-surviving-game');

        Redis::incrby('views:game:99999999', 2);
        Redis::incrby("views:game:{$game->id}", 6);

        (new FlushViewCounters)->handle();

        $this->assertSame(6, (int) $game->fresh()->views);

        Redis::del('views:game:99999999');
    }

    protected function tearDown(): void
    {
        foreach (Game::pluck('id') as $id) {
            Redis::del("views:game:{$id}");
        }

        parent::tearDown();
    }
}
