<?php

namespace Tests\Feature;

use App\Jobs\SendReleaseReminders;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Notifications\GameReleaseNotification;
use App\Services\RawgService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /** RAWG is the only source, so the tests speak RAWG's shape. */
    private function rawgGame(array $attrs = []): array
    {
        static $n = 0;
        $n++;

        return array_merge([
            'id' => $n,
            'slug' => 'rawg-game-'.$n,
            'name' => 'RAWG Game '.$n,
            'released' => now()->startOfMonth()->addDays(7)->toDateString(),
            'background_image' => 'https://example.com/'.$n.'.jpg',
            'rating' => 4.1,
            'added' => 1000,
            'genres' => [['name' => 'Action']],
            'platforms' => [['platform' => ['name' => 'PC', 'slug' => 'pc']]],
            'publishers' => [['name' => 'Some Publisher']],
        ], $attrs);
    }

    private function fakeRawg(array $games, array $followed = []): void
    {
        $mock = Mockery::mock(RawgService::class);
        $mock->shouldReceive('getReleases')
            ->andReturnUsing(function ($from, $to, $ordering = 'released') use ($games, $followed) {
                // The "most followed" call asks for -added over a long window.
                return ['count' => count($games), 'results' => $ordering === '-added' ? $followed : $games];
            });

        $this->app->instance(RawgService::class, $mock);
    }

    public function test_the_month_comes_from_rawg_and_is_grouped_by_day(): void
    {
        $day = now()->startOfMonth()->addDays(7)->toDateString();
        $other = now()->startOfMonth()->addDays(14)->toDateString();

        $this->fakeRawg([
            $this->rawgGame(['name' => 'Voidfall', 'released' => $day, 'added' => 2100]),
            $this->rawgGame(['name' => 'Outcasts Reborn', 'released' => $day, 'added' => 1200]),
            $this->rawgGame(['name' => 'Echoes of Elysium', 'released' => $other, 'added' => 2800]),
        ]);

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame(3, $data['stats']['releases']);
        $this->assertCount(2, $data['days']);
        $this->assertSame($day, $data['days'][0]['date']);
        // Within a day, the most anticipated leads.
        $this->assertSame('Voidfall', $data['days'][0]['games'][0]['name']);
        $this->assertSame('Echoes of Elysium', $data['most_anticipated'][0]['name']);
        $this->assertSame(now()->format('Y-m'), $data['month']['key']);
    }

    public function test_platform_and_genre_filters_narrow_the_month(): void
    {
        $this->fakeRawg([
            $this->rawgGame(['name' => 'PC Only', 'platforms' => [['platform' => ['name' => 'PC', 'slug' => 'pc']]]]),
            $this->rawgGame([
                'name' => 'PlayStation Only',
                'genres' => [['name' => 'RPG']],
                'platforms' => [['platform' => ['name' => 'PlayStation 5', 'slug' => 'playstation5']]],
            ]),
        ]);

        $pc = $this->getJson('/api/v1/calendar?platform=pc')->assertOk()->json('data');
        $this->assertSame(1, $pc['stats']['showing']);
        $this->assertSame('PC Only', $pc['days'][0]['games'][0]['name']);

        $rpg = $this->getJson('/api/v1/calendar?genre=RPG')->assertOk()->json('data');
        $this->assertSame('PlayStation Only', $rpg['days'][0]['games'][0]['name']);

        // The unfiltered totals stay honest beside the filtered view.
        $this->assertSame(2, $pc['stats']['releases']);
    }

    public function test_the_platform_breakdown_counts_the_whole_month(): void
    {
        $this->fakeRawg([
            $this->rawgGame(['platforms' => [
                ['platform' => ['name' => 'PC', 'slug' => 'pc']],
                ['platform' => ['name' => 'PlayStation 5', 'slug' => 'playstation5']],
            ]]),
            $this->rawgGame(['platforms' => [['platform' => ['name' => 'PC', 'slug' => 'pc']]]]),
        ]);

        $breakdown = collect($this->getJson('/api/v1/calendar')->assertOk()->json('data.platform_breakdown'))->keyBy('key');

        $this->assertSame(2, $breakdown['pc']['count']);
        $this->assertSame(1, $breakdown['playstation']['count']);
    }

    public function test_our_own_wishlist_numbers_are_merged_onto_rawg_rows(): void
    {
        $game = Game::create(['slug' => 'shared-slug', 'name' => 'Shared Game']);

        foreach (range(1, 3) as $_) {
            UserGame::create(['user_id' => User::factory()->create()->id, 'game_id' => $game->id, 'status' => 'wishlist']);
        }

        $viewer = User::factory()->create();
        UserGame::create(['user_id' => $viewer->id, 'game_id' => $game->id, 'status' => 'wishlist']);

        $this->fakeRawg([$this->rawgGame(['slug' => 'shared-slug', 'name' => 'Shared Game'])]);

        $row = $this->actingAs($viewer, 'sanctum')->getJson('/api/v1/calendar')->assertOk()->json('data.days.0.games.0');

        $this->assertSame(4, $row['wishlists'], 'RAWG cannot know this — we can');
        $this->assertTrue($row['wishlisted']);
        $this->assertFalse($row['reminder']);
    }

    public function test_an_anonymous_visitor_sees_the_month_without_a_watchlist(): void
    {
        $this->fakeRawg([$this->rawgGame()]);

        $data = $this->getJson('/api/v1/calendar')->assertOk()->json('data');

        $this->assertSame([], $data['watchlist']);
        $this->assertFalse($data['days'][0]['games'][0]['wishlisted']);
    }

    public function test_the_reminder_toggles_and_wishlists_on_the_way_in(): void
    {
        $user = User::factory()->create();
        $game = Game::create(['slug' => 'remind-me', 'name' => 'Remind Me', 'released' => now()->addWeek()->toDateString()]);

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

        $game = Game::create(['slug' => 'lands-today', 'name' => 'Lands Today', 'released' => now()->toDateString()]);

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

    public function test_a_rawg_outage_says_so_instead_of_showing_an_empty_month(): void
    {
        $mock = Mockery::mock(RawgService::class);
        $mock->shouldReceive('getReleases')->andReturn(null);
        $this->app->instance(RawgService::class, $mock);

        $this->getJson('/api/v1/calendar')->assertStatus(503);
    }

    public function test_the_month_can_be_stepped_through(): void
    {
        $this->fakeRawg([]);

        $data = $this->getJson('/api/v1/calendar?month=2026-08')->assertOk()->json('data.month');

        $this->assertSame('2026-08', $data['key']);
        $this->assertSame('August', $data['label']);
        $this->assertSame(2026, $data['year']);
        $this->assertSame('2026-07', $data['previous']);
        $this->assertSame('2026-09', $data['next']);
    }
}
