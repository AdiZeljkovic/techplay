<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameStoreLink;
use App\Services\Releases\SteamCatalog;
use App\Services\Releases\SteamSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SteamReleaseSyncTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<int,string> one entry per listing page */
    private array $pages = [];

    /** @var array<string,array> detail payloads keyed by appid */
    private array $detailMap = [];

    private int $cursor = 0;

    /** @var array<int,string> appids Steam will answer 429 for */
    private array $throttled = [];

    /** @var array<int,string> appids Steam positively says no longer exist */
    private array $delisted = [];

    protected function setUp(): void
    {
        parent::setUp();

        // The tests speak in requests, not seconds.
        config(['releases.delay_ms' => 0]);

        // Registered once. Http::fake() merges rather than replaces, so a
        // second registration would leave the first stub in front of it — and
        // several of these tests sync twice to prove the second pass is cheap.
        Http::fake([
            'store.steampowered.com/search/results*' => function () {
                $html = $this->pages[$this->cursor] ?? '';
                $this->cursor++;

                return Http::response(['success' => 1, 'results_html' => $html, 'total_count' => 999]);
            },
            'store.steampowered.com/api/appdetails*' => function ($request) {
                parse_str(parse_url($request->url(), PHP_URL_QUERY) ?: '', $query);
                $id = $query['appids'] ?? '';

                if (in_array($id, $this->throttled, true)) {
                    return Http::response('', 429);
                }

                if (in_array($id, $this->delisted, true)) {
                    return Http::response([$id => ['success' => false]]);
                }

                return Http::response([$id => ['success' => true, 'data' => $this->detailMap[$id] ?? $this->details()]]);
            },
        ]);
    }

    /** A listing row in the markup Steam actually returns. */
    private function row(array $attrs = []): string
    {
        $a = array_merge([
            'appid' => '4975090',
            'title' => 'Shadow Princess',
            'date' => '3 Aug, 2026',
            'tags' => '19,1773,4182,492',
        ], $attrs);

        return '<a href="https://store.steampowered.com/app/'.$a['appid'].'/" data-ds-appid="'.$a['appid'].'"'
            .' data-ds-tagids="['.$a['tags'].']" class="search_result_row">'
            .'<div class="search_capsule"><img src="https://cdn.example/'.$a['appid'].'/capsule.jpg" ></div>'
            .'<div class="search_name ellipsis"><span class="title">'.$a['title'].'</span></div>'
            .'<div class="search_released responsive_secondrow"> '.$a['date'].' </div></a>';
    }

    /** The detail payload, in Steam's shape. */
    private function details(array $attrs = []): array
    {
        return array_merge([
            'type' => 'game',
            'name' => 'Shadow Princess',
            'short_description' => str_repeat('A real description of a real game. ', 10),
            'header_image' => 'https://cdn.example/header.jpg',
            'screenshots' => array_fill(0, 8, ['path_full' => 'https://cdn.example/s.jpg']),
            'movies' => [['mp4' => ['max' => 'https://cdn.example/t.mp4']]],
            'developers' => ['Some Studio'],
            'publishers' => ['Some Publisher'],
            'genres' => [['description' => 'Action'], ['description' => 'RPG']],
            'metacritic' => ['score' => 84],
            'content_descriptors' => ['ids' => []],
        ], $attrs);
    }

    /**
     * What Steam will answer on the next sync. Calling this again stands in for
     * a later day on which the store says something different.
     *
     * @param  array<int,string>  $listingRows  one entry per page
     * @param  array<string,array>  $details  keyed by appid
     */
    private function fakeSteam(array $listingRows, array $details = []): void
    {
        $this->pages = $listingRows;
        $this->detailMap = $details;
        $this->cursor = 0;
    }

    private function sync(): array
    {
        return app(SteamSync::class)->run(Carbon::parse('2026-08-01'), Carbon::parse('2026-10-31'));
    }

    /* ── reading the listing ──────────────────────────────────────────── */

    public function test_dates_keep_the_precision_the_publisher_committed_to(): void
    {
        $catalog = app(SteamCatalog::class);

        $cases = [
            '3 Aug, 2026' => ['2026-08-03', 'day'],
            'August 2026' => ['2026-08-01', 'month'],
            'Q3 2026' => ['2026-07-01', 'quarter'],
            '2026' => ['2026-01-01', 'year'],
            'To be announced' => [null, 'tba'],
            'Coming soon' => [null, 'tba'],
        ];

        foreach ($cases as $raw => [$date, $precision]) {
            [$anchor, $got] = $catalog->parseDate($raw);

            $this->assertSame($precision, $got, "precision of '{$raw}'");
            $this->assertSame($date, $anchor?->toDateString(), "anchor of '{$raw}'");
        }
    }

    public function test_the_listing_gives_us_everything_but_quality(): void
    {
        $rows = app(SteamCatalog::class)->parseRows($this->row(['title' => 'Big Walk', 'tags' => '19,492']));

        $this->assertCount(1, $rows);
        $this->assertSame('4975090', $rows[0]['store_id']);
        $this->assertSame('Big Walk', $rows[0]['title']);
        $this->assertSame([19, 492], $rows[0]['tag_ids']);
        $this->assertSame('2026-08-03', $rows[0]['anchor']->toDateString());
    }

    /* ── the sync itself ──────────────────────────────────────────────── */

    public function test_a_new_game_is_ingested_with_its_art_and_details(): void
    {
        $this->fakeSteam([$this->row()]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['created']);

        $game = Game::first();
        $this->assertSame('Shadow Princess', $game->name);
        $this->assertSame('2026-08-03', $game->released->toDateString());
        $this->assertSame('day', $game->release_precision);
        $this->assertSame('https://cdn.example/header.jpg', $game->cover_url);
        $this->assertSame('shadow princess', $game->match_key);
        $this->assertCount(8, $game->screenshots);
        $this->assertCount(1, $game->videos);

        $link = GameStoreLink::first();
        $this->assertSame('steam', $link->store);
        $this->assertSame('4975090', $link->store_id);
        $this->assertSame($game->id, $link->game_id);
    }

    public function test_adult_titles_are_dropped_before_we_ask_steam_anything(): void
    {
        // 12095 is Sexual Content, and it is visible in the listing.
        $this->fakeSteam([$this->row(['tags' => '19,12095'])]);

        $tally = $this->sync();

        $this->assertSame(0, $tally['seen'], 'it never even entered the window');
        $this->assertSame(0, Game::count());

        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'appdetails'));
    }

    public function test_junk_is_rejected_and_the_rejection_is_remembered(): void
    {
        $this->fakeSteam(
            [$this->row(['appid' => '111'])],
            ['111' => $this->details(['type' => 'demo'])],
        );

        $tally = $this->sync();

        $this->assertSame(1, $tally['rejected']);
        $this->assertSame(0, Game::count());

        $link = GameStoreLink::first();
        $this->assertNull($link->game_id);
        $this->assertSame('not a game (demo)', $link->rejected_reason);
    }

    public function test_a_remembered_rejection_is_never_fetched_again(): void
    {
        $this->fakeSteam([$this->row(['appid' => '111'])], ['111' => $this->details(['type' => 'dlc'])]);
        $this->sync();
        $spentOnFirstPass = $this->detailCalls();

        // Second pass over the same listing.
        $this->fakeSteam([$this->row(['appid' => '111'])]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['unchanged']);
        $this->assertSame(1, GameStoreLink::count(), 'no second row for the same listing');
        $this->assertSame($spentOnFirstPass, $this->detailCalls(), 'a rejection is never re-fetched');
    }

    public function test_a_delay_is_picked_up_from_the_listing_alone(): void
    {
        $this->fakeSteam([$this->row()]);
        $this->sync();
        $spentOnFirstPass = $this->detailCalls();

        // Steam now says the game slipped to October.
        $this->fakeSteam([$this->row(['date' => '14 Oct, 2026'])]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['updated']);
        $this->assertSame('2026-10-14', Game::first()->released->toDateString());

        // The whole point of the two-layer design: a date change is free.
        $this->assertSame($spentOnFirstPass, $this->detailCalls(), 'a delay costs no detail request');
    }

    public function test_being_throttled_is_not_a_verdict_about_the_game(): void
    {
        // The first production run filed 115 titles away as "unavailable" when
        // Steam was simply refusing to talk to us that fast. Each one was then
        // permanently blacklisted, because a rejection is never re-fetched.
        $this->throttled = ['111'];
        $this->fakeSteam([$this->row(['appid' => '111'])]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['skipped']);
        $this->assertSame(0, GameStoreLink::count(), 'a failed request leaves no trace');

        // Steam recovers, and the title is picked up as if nothing happened.
        $this->throttled = [];
        $this->fakeSteam([$this->row(['appid' => '111'])]);

        $this->assertSame(1, $this->sync()['created']);
    }

    public function test_a_title_steam_says_is_gone_is_remembered_as_gone(): void
    {
        // An explicit refusal is an answer, unlike a failed request, and asking
        // again next month will not bring the product back.
        $this->delisted = ['111'];
        $this->fakeSteam([$this->row(['appid' => '111'])]);

        $this->assertSame(1, $this->sync()['rejected']);
        $this->assertSame('unavailable', GameStoreLink::first()->rejected_reason);
    }

    public function test_titles_lost_to_the_old_bug_are_picked_back_up(): void
    {
        // Exactly the rows the first production run left behind.
        GameStoreLink::create([
            'game_id' => null,
            'store' => 'steam',
            'store_id' => '111',
            'rejected_reason' => 'unavailable',
        ]);

        $this->fakeSteam([$this->row(['appid' => '111'])]);

        $this->assertSame(1, $this->sync()['created']);
        $this->assertSame(1, GameStoreLink::count(), 'the stale row is replaced, not duplicated');
        $this->assertNotNull(GameStoreLink::first()->game_id);
    }

    public function test_every_title_is_reported_even_the_ones_already_known(): void
    {
        // A resumed run is almost entirely titles we already have. Reporting
        // only new ones made a working sync look like a hung one.
        $this->fakeSteam([$this->row()]);
        $this->sync();

        $this->fakeSteam([$this->row()]);

        $seen = [];
        app(SteamSync::class)->run(
            Carbon::parse('2026-08-01'),
            Carbon::parse('2026-10-31'),
            function (array $row, string $verdict) use (&$seen) {
                $seen[] = $verdict;
            },
        );

        $this->assertSame(['unchanged'], $seen);
    }

    public function test_the_window_size_is_announced_before_the_work_starts(): void
    {
        $this->fakeSteam([$this->row(['appid' => '1']).$this->row(['appid' => '2'])]);

        $announced = null;
        app(SteamSync::class)->run(
            Carbon::parse('2026-08-01'),
            Carbon::parse('2026-10-31'),
            null,
            function (int $total) use (&$announced) {
                $announced = $total;
            },
        );

        $this->assertSame(2, $announced);
    }

    public function test_demos_and_dlc_are_excluded_by_the_request_itself(): void
    {
        // About a quarter of Steam's raw "coming soon" listing is demos and
        // DLC, and each one used to cost a detail request to find that out.
        // Asking Steam for games only settles it before we spend anything.
        $this->fakeSteam([$this->row()]);
        $this->sync();

        Http::assertSent(fn ($request) => str_contains($request->url(), 'search/results')
            && str_contains($request->url(), 'category1=998'));
    }

    public function test_a_missing_config_is_loud_rather_than_an_empty_month(): void
    {
        // A deploy whose config cache predated config/releases.php produced a
        // sync reporting zero upcoming games, which looked exactly like Steam
        // having nothing to say. Opposite situations; never the same output.
        config(['releases.timeout' => null]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/config:cache/');

        $this->fakeSteam([$this->row()]);
        $this->sync();
    }

    /** How many times we have asked Steam about an individual game. */
    private function detailCalls(): int
    {
        return Http::recorded(fn ($request) => str_contains($request->url(), 'appdetails'))->count();
    }

    public function test_an_editors_correction_survives_the_next_sync(): void
    {
        $this->fakeSteam([$this->row()]);
        $this->sync();

        Game::first()->forceFill([
            'released' => '2026-09-09',
            'locked_fields' => ['released'],
        ])->save();

        $this->fakeSteam([$this->row(['date' => '14 Oct, 2026'])]);
        $this->sync();

        $this->assertSame('2026-09-09', Game::first()->released->toDateString(), 'the store does not overrule an editor');
    }

    public function test_the_walk_stops_once_it_is_past_the_window(): void
    {
        $this->fakeSteam([
            $this->row(['appid' => '1', 'date' => '3 Aug, 2026']),
            $this->row(['appid' => '2', 'date' => '5 Dec, 2026']),
            $this->row(['appid' => '3', 'date' => '9 Dec, 2026']),
        ]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['seen'], 'the listing is date-ordered, so December ends the walk');
        $this->assertSame(1, Game::count());
    }

    public function test_the_window_is_three_months_wide_by_default(): void
    {
        Carbon::setTestNow('2026-08-04');

        [$from, $to] = app(SteamSync::class)->window(null, null);

        $this->assertSame('2026-08-01', $from->toDateString());
        $this->assertSame('2026-10-31', $to->toDateString());
    }

    public function test_two_games_with_the_same_name_get_separate_slugs(): void
    {
        $this->fakeSteam([
            $this->row(['appid' => '1']).$this->row(['appid' => '2']),
        ]);

        $this->sync();

        $this->assertSame(['shadow-princess', 'shadow-princess-2'], Game::orderBy('id')->pluck('slug')->all());
    }
}
