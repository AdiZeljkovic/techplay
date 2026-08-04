<?php

namespace Tests\Feature;

use App\Jobs\SendReleaseReminders;
use App\Models\Game;
use App\Models\GameStoreLink;
use App\Models\User;
use App\Models\UserGame;
use App\Notifications\GameReleaseNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The calendar must not reach for anything. Any request at all is a
        // regression: this endpoint used to go down whenever RAWG did.
        Http::preventStrayRequests();
    }

    /** A calendar entry, as the aggregator would have written it. */
    private function entry(array $attrs = [], array $stores = ['steam']): Game
    {
        static $n = 0;
        $n++;

        $game = Game::create(array_merge([
            'slug' => 'game-'.$n,
            'name' => 'Game '.$n,
            'match_key' => 'game '.$n,
            'released' => now()->startOfMonth()->addDays(7)->toDateString(),
            'release_precision' => 'day',
            'background_image' => 'https://example.com/'.$n.'.jpg',
            'rating' => 4.1,
            'hype_score' => 100,
            'genre_names' => ['Action'],
            'platform_names' => ['PC'],
            'details_data' => ['publisher' => 'Some Publisher'],
            // Enough to clear the calendar's visibility rules by default; the
            // tests that care about those set their own.
            'movies_data' => ['https://cdn.example/trailer.mp4'],
        ], $attrs));

        foreach ($stores as $store) {
            GameStoreLink::create(['game_id' => $game->id, 'store' => $store, 'store_id' => $store.'-'.$n]);
        }

        return $game;
    }

    public function test_the_month_comes_from_our_own_tables_and_is_grouped_by_day(): void
    {
        $day = now()->startOfMonth()->addDays(7)->toDateString();
        $other = now()->startOfMonth()->addDays(14)->toDateString();

        $this->entry(['name' => 'Voidfall', 'released' => $day, 'hype_score' => 2100]);
        $this->entry(['name' => 'Outcasts Reborn', 'released' => $day, 'hype_score' => 1200]);
        $this->entry(['name' => 'Echoes of Elysium', 'released' => $other, 'hype_score' => 2800]);

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame(3, $data['stats']['releases']);
        $this->assertCount(2, $data['days']);
        $this->assertSame($day, $data['days'][0]['date']);
        // Within a day, the biggest leads.
        $this->assertSame('Voidfall', $data['days'][0]['games'][0]['name']);
        $this->assertSame('Echoes of Elysium', $data['most_anticipated'][0]['name']);
        $this->assertSame(now()->format('Y-m'), $data['month']['key']);
    }

    public function test_the_historical_archive_is_not_the_calendar(): void
    {
        // 200,000 rows carry no match_key. They are a games database, not a
        // list of what is coming out.
        Game::create([
            'slug' => 'half-life-2',
            'name' => 'Half-Life 2',
            'released' => now()->startOfMonth()->addDays(3)->toDateString(),
        ]);

        $this->entry(['name' => 'Actually Upcoming']);

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame(1, $data['stats']['releases']);
        $this->assertSame('Actually Upcoming', $data['days'][0]['games'][0]['name']);
    }

    public function test_platform_and_genre_filters_narrow_the_month(): void
    {
        $this->entry(['name' => 'PC Only', 'platform_names' => ['PC']]);
        $this->entry(['name' => 'Console Only', 'genre_names' => ['RPG'], 'platform_names' => ['Xbox Series X|S']]);

        $pc = $this->getJson('/api/v1/calendar?platform=pc')->assertOk()->json('data');
        $this->assertSame(1, $pc['stats']['showing']);
        $this->assertSame('PC Only', $pc['days'][0]['games'][0]['name']);

        // Hardware is named differently by every store, so families match on
        // the maker rather than an exact string.
        $xbox = $this->getJson('/api/v1/calendar?platform=xbox')->assertOk()->json('data');
        $this->assertSame('Console Only', $xbox['days'][0]['games'][0]['name']);

        $rpg = $this->getJson('/api/v1/calendar?genre=RPG')->assertOk()->json('data');
        $this->assertSame('Console Only', $rpg['days'][0]['games'][0]['name']);

        // The unfiltered totals stay honest beside the filtered view.
        $this->assertSame(2, $pc['stats']['releases']);
    }

    public function test_a_merged_game_counts_for_every_platform_it_lands_on(): void
    {
        // The reason phase four existed: one entry, three platforms, and the
        // breakdown has to reflect that rather than picking one.
        $this->entry([
            'name' => 'Silksong',
            'platform_names' => ['PC', 'Xbox Series X|S', 'Nintendo Switch'],
        ], ['steam', 'xbox', 'nintendo']);

        $breakdown = collect($this->getJson('/api/v1/calendar')->assertOk()->json('data.platform_breakdown'))->keyBy('key');

        $this->assertSame(1, $breakdown['pc']['count']);
        $this->assertSame(1, $breakdown['xbox']['count']);
        $this->assertSame(1, $breakdown['nintendo']['count']);
    }

    public function test_our_own_wishlist_numbers_are_on_every_row(): void
    {
        $game = $this->entry(['name' => 'Shared Game']);

        foreach (range(1, 3) as $_) {
            UserGame::create(['user_id' => User::factory()->create()->id, 'game_id' => $game->id, 'status' => 'wishlist']);
        }

        $viewer = User::factory()->create();
        UserGame::create(['user_id' => $viewer->id, 'game_id' => $game->id, 'status' => 'wishlist']);

        $row = $this->actingAs($viewer, 'sanctum')->getJson('/api/v1/calendar')->assertOk()->json('data.days.0.games.0');

        $this->assertSame(4, $row['wishlists']);
        $this->assertTrue($row['wishlisted']);
        $this->assertFalse($row['reminder']);
    }

    public function test_an_anonymous_visitor_sees_the_month_without_a_watchlist(): void
    {
        $this->entry();

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame([], $data['watchlist']);
        $this->assertFalse($data['days'][0]['games'][0]['wishlisted']);
    }

    public function test_a_month_that_ships_nothing_is_an_answer_not_an_outage(): void
    {
        // This used to be a 503, because an empty answer from RAWG and RAWG
        // being unreachable were the same thing. They are not.
        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame(0, $data['stats']['releases']);
        $this->assertSame([], $data['days']);
    }

    public function test_a_month_is_not_everything_the_stores_shipped(): void
    {
        // A quarter of all four stores is around 1,300 titles and most of a
        // month's four hundred are small PC releases nobody came looking for.
        // Storing them is right; crowding the month with them is not.
        $this->entry(['name' => 'Has A Trailer']);

        $this->entry([
            'name' => 'Nobody Meant This',
            'movies_data' => [],
            'screenshots_data' => [],
            'details_data' => ['publisher' => 'Someone', 'description' => 'Short.'],
        ]);

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame(1, $data['stats']['releases']);
        $this->assertSame('Has A Trailer', $data['days'][0]['games'][0]['name']);

        // But it is not deleted — it is still there to be found.
        $this->assertSame(2, Game::whereNotNull('match_key')->count());
    }

    public function test_any_one_sign_that_somebody_meant_it_is_enough(): void
    {
        $bare = [
            'movies_data' => [],
            'screenshots_data' => [],
            'details_data' => ['publisher' => 'Someone', 'description' => 'Short.'],
        ];

        // Each of these fails every rule but one.
        $this->entry(array_merge($bare, ['name' => 'Multi Platform']), ['steam', 'xbox']);
        $this->entry(array_merge($bare, ['name' => 'Reviewed', 'metacritic' => 84]));
        $this->entry(array_merge($bare, [
            'name' => 'Substantial',
            'screenshots_data' => array_fill(0, 9, 'a.jpg'),
            'details_data' => ['publisher' => 'Someone', 'description' => str_repeat('Real copy. ', 70)],
        ]));

        $wanted = $this->entry(array_merge($bare, ['name' => 'Wanted Here']));
        UserGame::create(['user_id' => User::factory()->create()->id, 'game_id' => $wanted->id, 'status' => 'wishlist']);

        $names = collect($this->getJson('/api/v1/calendar')->assertOk()->json('data.days.0.games'))->pluck('name');

        foreach (['Multi Platform', 'Reviewed', 'Substantial', 'Wanted Here'] as $name) {
            $this->assertContains($name, $names, "{$name} earned its place");
        }
    }

    public function test_the_month_can_be_stepped_through(): void
    {
        $data = $this->getJson('/api/v1/calendar?month=2026-08')->assertOk()->json('data.month');

        $this->assertSame('2026-08', $data['key']);
        $this->assertSame('August', $data['label']);
        $this->assertSame(2026, $data['year']);
        $this->assertSame('2026-07', $data['previous']);
        $this->assertSame('2026-09', $data['next']);
    }

    public function test_what_is_coming_after_this_month_is_ranked_by_size(): void
    {
        $this->entry(['name' => 'Small Thing Later', 'released' => now()->addMonths(2)->toDateString(), 'hype_score' => 40]);
        $this->entry(['name' => 'Big Thing Later', 'released' => now()->addMonths(3)->toDateString(), 'hype_score' => 900]);

        $followed = $this->getJson('/api/v1/calendar')->assertOk()->json('data.most_followed');

        $this->assertSame('Big Thing Later', $followed[0]['name']);
    }

    /* ── reminders ────────────────────────────────────────────────────── */

    public function test_the_reminder_toggles_and_wishlists_on_the_way_in(): void
    {
        $user = User::factory()->create();
        $game = $this->entry(['slug' => 'remind-me', 'released' => now()->addWeek()->toDateString()]);

        $this->actingAs($user)->postJson('/api/v1/calendar/remind-me/reminder')
            ->assertOk()
            ->assertJsonPath('data.reminder', true);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();
        $this->assertSame('wishlist', $entry->status, 'asking to be told implies wanting it');
        $this->assertTrue((bool) $entry->notify_on_release);

        // Off again — and the wishlist stays, because that was a separate choice.
        $this->actingAs($user)->postJson('/api/v1/calendar/remind-me/reminder')
            ->assertOk()
            ->assertJsonPath('data.reminder', false);

        $this->assertSame('wishlist', $entry->fresh()->status);
    }

    public function test_a_game_we_do_not_have_cannot_be_reminded_on(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/calendar/not-in-our-database/reminder')
            ->assertStatus(404);
    }

    public function test_release_day_notifies_every_watcher_exactly_once(): void
    {
        Notification::fake();

        $game = $this->entry(['slug' => 'lands-today', 'released' => now()->toDateString()]);

        $watchers = collect(range(1, 2))->map(function () use ($game) {
            $user = User::factory()->create();
            UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'wishlist', 'notify_on_release' => true]);

            return $user;
        });

        // Wishlisted but never asked to be told.
        $quiet = User::factory()->create();
        UserGame::create(['user_id' => $quiet->id, 'game_id' => $game->id, 'status' => 'wishlist']);

        (new SendReleaseReminders)->handle();

        Notification::assertSentTo($watchers->all(), GameReleaseNotification::class);
        Notification::assertNotSentTo($quiet, GameReleaseNotification::class);

        // The flag is the pending state — a rerun sends nothing.
        $this->assertSame(0, UserGame::where('notify_on_release', true)->count());
    }
}
