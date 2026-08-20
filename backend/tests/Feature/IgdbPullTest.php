<?php

namespace Tests\Feature;

use App\Services\Igdb\IgdbClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The download half of the IGDB import.
 *
 * Everything here is about the two things that decide whether a five-million-row
 * pull finishes: that paging walks the whole table, and that being interrupted
 * costs the last page rather than the run. Both are cheap to get wrong and
 * expensive to discover at row four million.
 */
class IgdbPullTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        config([
            'services.igdb.client_id' => 'test-id',
            'services.igdb.client_secret' => 'test-secret',
            'services.igdb.requests_per_second' => 1000,   // no real waiting in tests
        ]);
    }

    private function fakeToken(): array
    {
        return ['id.twitch.tv/*' => Http::response(['access_token' => 'tok', 'expires_in' => 5000000])];
    }

    /** A page of `n` rows whose ids start just after `$after`. */
    private function page(int $after, int $n): array
    {
        return array_map(fn ($i) => ['id' => $after + $i, 'name' => 'Game '.($after + $i)], range(1, $n));
    }

    /**
     * Offset paging dies at 5,000 on their side, so the pull walks by id. If it
     * ever stopped advancing the cursor it would fetch page one forever — and
     * against a real endpoint that failure looks exactly like a slow import.
     */
    public function test_paging_walks_by_id_and_stops_on_a_short_page(): void
    {
        $asked = [];

        Http::fake(array_merge($this->fakeToken(), [
            'api.igdb.com/*' => function ($request) use (&$asked) {
                $asked[] = $request->body();

                preg_match('/id > (\d+)/', $request->body(), $m);
                $after = (int) ($m[1] ?? 0);

                // Two full pages of 500, then a short one that ends it.
                return Http::response(match (true) {
                    $after === 0 => $this->page(0, IgdbClient::PAGE),
                    $after === IgdbClient::PAGE => $this->page(IgdbClient::PAGE, IgdbClient::PAGE),
                    default => $this->page(1000, 7),
                });
            },
        ]));

        $seen = 0;
        foreach (app(IgdbClient::class)->each('games') as $page) {
            $seen += count($page);
        }

        $this->assertSame(1007, $seen);
        $this->assertCount(3, $asked, 'a fourth request means the short page did not end it');
        $this->assertStringContainsString('id > 0', $asked[0]);
        $this->assertStringContainsString('id > 500', $asked[1]);
        $this->assertStringContainsString('id > 1000', $asked[2]);
    }

    /**
     * Their limit is four a second and they answer a fifth with 429. Dropping
     * that page would leave a hole in the staging table that nothing downstream
     * would notice until a game came out with no cover.
     */
    public function test_a_rate_limited_page_is_retried_rather_than_lost(): void
    {
        $calls = 0;

        Http::fake(array_merge($this->fakeToken(), [
            'api.igdb.com/*' => function () use (&$calls) {
                $calls++;

                return $calls === 1
                    ? Http::response('Too Many Requests', 429)
                    : Http::response([['id' => 1, 'name' => 'Kept']]);
            },
        ]));

        $rows = app(IgdbClient::class)->query('games', 'fields *;');

        $this->assertSame('Kept', $rows[0]['name']);
        $this->assertSame(2, $calls);
    }

    /** A revoked token is thrown away and asked for again, once. */
    public function test_an_expired_token_is_replaced_and_the_call_repeated(): void
    {
        $calls = 0;

        Http::fake(array_merge($this->fakeToken(), [
            'api.igdb.com/*' => function () use (&$calls) {
                $calls++;

                return $calls === 1
                    ? Http::response('Unauthorized', 401)
                    : Http::response([['id' => 9, 'name' => 'After refresh']]);
            },
        ]));

        $rows = app(IgdbClient::class)->query('games', 'fields *;');

        $this->assertSame('After refresh', $rows[0]['name']);
    }

    /**
     * The pull has to survive being stopped, because it will be. A second run
     * must resume rather than start again, and must not duplicate what it has.
     */
    public function test_a_second_run_resumes_and_does_not_duplicate(): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => 42,
            'payload' => json_encode(['id' => 42, 'name' => 'Already here']),
            'fetched_at' => now(),
        ]);

        $asked = [];

        Http::fake(array_merge($this->fakeToken(), [
            'api.igdb.com/*' => function ($request) use (&$asked) {
                // Only the page requests. The count call goes to the same host
                // and would otherwise be recorded as if it were one of them.
                if (str_contains($request->body(), 'sort id asc')) {
                    $asked[] = $request->body();
                }

                return Http::response([
                    ['id' => 43, 'name' => 'Next'],
                    ['id' => 44, 'name' => 'Last'],
                ]);
            },
        ]));

        $this->artisan('igdb:pull', ['--endpoint' => ['games']])->assertSuccessful();

        $this->assertStringContainsString('id > 42', $asked[0], 'the run started from the top instead of resuming');
        $this->assertSame(3, DB::table('igdb_raw')->where('endpoint', 'games')->count());
        $this->assertSame(
            'Already here',
            json_decode(DB::table('igdb_raw')->where('igdb_id', 42)->value('payload'), true)['name'],
        );
    }

    /**
     * Re-running over rows we already hold refreshes them. IGDB edits its
     * entries — a game gets a release date, a studio gets renamed — so a pull
     * that could only insert would freeze the copy at whatever it first saw.
     */
    public function test_re_pulling_updates_a_row_in_place(): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => 7,
            'payload' => json_encode(['id' => 7, 'name' => 'Old name']),
            'fetched_at' => now()->subDay(),
        ]);

        Http::fake(array_merge($this->fakeToken(), [
            'api.igdb.com/*' => Http::response([['id' => 7, 'name' => 'Renamed']]),
        ]));

        $this->artisan('igdb:pull', ['--endpoint' => ['games'], '--fresh' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('igdb_raw')->where('endpoint', 'games')->count());
        $this->assertSame(
            'Renamed',
            json_decode(DB::table('igdb_raw')->where('igdb_id', 7)->value('payload'), true)['name'],
        );
    }

    /** Without credentials it says so and stops, rather than failing per endpoint. */
    public function test_it_refuses_to_run_without_credentials(): void
    {
        config(['services.igdb.client_id' => '', 'services.igdb.client_secret' => '']);

        $this->artisan('igdb:pull')->assertFailed();
    }
}
