<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\ReputationSnapshot;
use App\Models\Season;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function board(string $type = 'xp', string $period = 'all'): array
    {
        return $this->getJson("/api/v1/leaderboard?type={$type}&period={$period}")->assertOk()->json('data');
    }

    public function test_the_xp_board_ranks_by_xp_and_carries_the_row_the_table_draws(): void
    {
        User::factory()->create(['username' => 'top', 'xp' => 5000]);
        User::factory()->create(['username' => 'mid', 'xp' => 2000]);

        $entries = $this->board()['entries'];

        $this->assertSame('top', $entries[0]['username']);
        $this->assertSame(1, $entries[0]['position']);
        $this->assertSame(5000, $entries[0]['value']);
        $this->assertArrayHasKey('level', $entries[0]);
        $this->assertArrayHasKey('games', $entries[0]);
        $this->assertArrayHasKey('reputation', $entries[0]);
        $this->assertSame('mid', $entries[1]['username']);
    }

    public function test_friends_only_profiles_are_absent_from_every_board(): void
    {
        User::factory()->create(['username' => 'hidden', 'xp' => 9999, 'profile_visibility' => User::VISIBILITY_FRIENDS]);
        User::factory()->create(['username' => 'shown', 'xp' => 10]);

        $this->assertSame(['shown'], collect($this->board()['entries'])->pluck('username')->all());
    }

    public function test_the_new_boards_count_what_they_say_they_count(): void
    {
        $user = User::factory()->create(['username' => 'collector']);
        $game = Game::create(['slug' => 'lb-game', 'name' => 'LB Game']);
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'completed']);

        $collection = $this->board('collection')['entries'];
        $this->assertSame('collector', $collection[0]['username']);
        $this->assertSame(1, $collection[0]['value']);
        $this->assertSame('Games', $collection[0]['label']);

        $completions = $this->board('completions')['entries'];
        $this->assertSame(1, $completions[0]['value']);
        $this->assertSame('Completed', $completions[0]['label']);
    }

    public function test_the_weekly_board_ranks_by_gain_not_by_total(): void
    {
        $week = now()->format('o-\WW');

        // Big total, tiny week.
        $veteran = User::factory()->create(['username' => 'veteran', 'xp' => 10000]);
        ReputationSnapshot::create(['user_id' => $veteran->id, 'period' => $week, 'xp' => 9950, 'reputation' => 0, 'contribution_points' => 0]);

        // Small total, big week.
        $rookie = User::factory()->create(['username' => 'rookie', 'xp' => 900]);
        ReputationSnapshot::create(['user_id' => $rookie->id, 'period' => $week, 'xp' => 100, 'reputation' => 0, 'contribution_points' => 0]);

        $entries = $this->board('xp', 'week')['entries'];

        $this->assertSame('rookie', $entries[0]['username'], 'the week is about movement, not accumulation');
        $this->assertSame(800, $entries[0]['value']);
        $this->assertSame(50, $entries[1]['value']);
    }

    public function test_boards_without_a_baseline_fall_back_to_all_time(): void
    {
        User::factory()->create(['username' => 'collector', 'xp' => 100]);

        // Collection has no snapshot to measure a week against.
        $this->assertSame('all', $this->board('collection', 'week')['period']);
    }

    public function test_a_signed_in_viewer_gets_their_own_standing_even_from_outside_the_top_fifty(): void
    {
        User::factory()->count(3)->create(['xp' => 9000]);
        $me = User::factory()->create(['username' => 'me', 'xp' => 100]);

        // The board is a public route, so only the sanctum guard sees the token.
        $viewer = $this->actingAs($me, 'sanctum')->getJson('/api/v1/leaderboard')->assertOk()->json('data.viewer');

        $this->assertTrue($viewer['ranked']);
        $this->assertSame('me', $viewer['username']);
        $this->assertSame(4, $viewer['position']);
        $this->assertSame(100, $viewer['value']);
        $this->assertArrayHasKey('level_progress', $viewer);
    }

    public function test_a_private_viewer_is_told_they_opted_out_rather_than_shown_a_rank(): void
    {
        $me = User::factory()->create(['xp' => 500, 'profile_visibility' => User::VISIBILITY_FRIENDS]);

        $viewer = $this->actingAs($me, 'sanctum')->getJson('/api/v1/leaderboard')->assertOk()->json('data.viewer');

        $this->assertFalse($viewer['ranked']);
        $this->assertSame('private', $viewer['reason']);
    }

    public function test_an_anonymous_visitor_gets_no_viewer_block(): void
    {
        User::factory()->create(['xp' => 500]);

        $this->assertNull($this->board()['viewer']);
    }

    public function test_rising_players_ranks_movement_and_leaves_out_anyone_standing_still(): void
    {
        $week = now()->format('o-\WW');

        $mover = User::factory()->create(['username' => 'mover', 'xp' => 1000]);
        ReputationSnapshot::create(['user_id' => $mover->id, 'period' => $week, 'xp' => 500, 'reputation' => 0, 'contribution_points' => 0]);

        $still = User::factory()->create(['username' => 'still', 'xp' => 8000]);
        ReputationSnapshot::create(['user_id' => $still->id, 'period' => $week, 'xp' => 8000, 'reputation' => 0, 'contribution_points' => 0]);

        $rising = $this->board()['rising'];

        $this->assertCount(1, $rising);
        $this->assertSame('mover', $rising[0]['username']);
        $this->assertSame(500, $rising[0]['gain']);
    }

    public function test_the_season_panel_appears_only_while_a_season_is_running(): void
    {
        User::factory()->create(['xp' => 100]);

        // Season 1 arrives with the migrations, so "no season running" has to
        // be arranged rather than assumed. Seeding live data from a migration
        // is why this assertion started failing — see docs/34.
        Season::query()->delete();
        Cache::flush();

        $this->assertNull($this->board()['season']);

        Season::create([
            'name' => 'Season 2: Ascend',
            'slug' => 'season-2',
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addDays(18)->toDateString(),
            'is_active' => true,
            'xp_multiplier' => 1.5,
            'bounty_multiplier' => 1.0,
        ]);
        Cache::flush();

        $season = $this->board()['season'];

        $this->assertSame('Season 2: Ascend', $season['name']);
        $this->assertNotNull($season['ends_at']);
        $this->assertSame(1.5, $season['xp_multiplier']);
    }

    public function test_an_unknown_board_or_period_is_refused(): void
    {
        $this->getJson('/api/v1/leaderboard?type=hair')->assertStatus(422);
        $this->getJson('/api/v1/leaderboard?period=fortnight')->assertStatus(422);
    }
}
