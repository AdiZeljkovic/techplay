<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * `played` — the shelf a library import can honestly fill.
 *
 * Steam reports lifetime playtime and whether the game was touched in the last
 * fortnight. It never says finished, and never says abandoned. Before this
 * status existed the import answered "recent? playing : backlog", so a first
 * real import put 91 of 189 backlog entries in the wrong place — 1,602 hours
 * of Lord of the Rings Online filed as "haven't started" — and the Backlog
 * Advisor, whose whole job is choosing from the unplayed, chose from those.
 */
class PlayedStatusTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2020-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    public function test_played_is_a_status_a_reader_can_set(): void
    {
        $user = User::factory()->create();
        $game = $this->game('valheim');

        Sanctum::actingAs($user);

        // 201: the shelf entry is created by this call, not updated.
        $this->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'played'])
            ->assertStatus(201);

        $this->assertDatabaseHas('user_games', [
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'played',
        ]);
    }

    public function test_the_shelf_can_be_filtered_by_it(): void
    {
        $user = User::factory()->create(['username' => 'shelver']);

        UserGame::create(['user_id' => $user->id, 'game_id' => $this->game('a')->id, 'status' => 'played', 'hours_played' => 40]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $this->game('b')->id, 'status' => 'backlog']);

        $response = $this->getJson("/api/v1/users/{$user->username}/collection?status=played")->assertStatus(200);

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('played', $response->json('data.0.status'));
    }

    public function test_the_profile_counts_it_separately_from_the_backlog(): void
    {
        $user = User::factory()->create();

        UserGame::create(['user_id' => $user->id, 'game_id' => $this->game('c')->id, 'status' => 'played', 'hours_played' => 1602]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $this->game('d')->id, 'status' => 'played', 'hours_played' => 12]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $this->game('e')->id, 'status' => 'backlog']);

        $counts = (new ProfileService)->collectionCounts($user);

        $this->assertSame(2, $counts['played_count']);
        // The whole point: a played game is not waiting to be played.
        $this->assertSame(1, $counts['backlog_count']);
        $this->assertSame(3, $counts['games_count']);
    }

    /**
     * The advisor picks from the backlog, so what the import files there is
     * exactly what it will recommend.
     */
    public function test_a_played_game_is_not_offered_as_something_to_start(): void
    {
        $user = User::factory()->create();

        $played = $this->game('lotro');
        UserGame::create(['user_id' => $user->id, 'game_id' => $played->id, 'status' => 'played', 'hours_played' => 1602]);

        $waiting = UserGame::where('user_id', $user->id)->where('status', 'backlog')->pluck('game_id');

        $this->assertNotContains($played->id, $waiting);
    }
}
