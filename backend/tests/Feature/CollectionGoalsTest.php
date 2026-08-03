<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\CollectionGoal;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CollectionGoalsTest extends TestCase
{
    use RefreshDatabase;

    private function addGames(User $user, string $status, int $n): void
    {
        foreach (range(1, $n) as $i) {
            $game = Game::create(['slug' => "{$status}-{$i}", 'name' => "Game {$status} {$i}", 'rating' => 4]);
            UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => $status]);
        }
    }

    public function test_goals_fall_back_to_suggested_targets(): void
    {
        $user = User::factory()->create(['username' => 'goalless']);

        $response = $this->getJson("/api/v1/users/{$user->username}/collection-goals")->assertStatus(200);
        $goals = collect($response->json('data'))->keyBy('type');

        $this->assertCount(3, $goals);
        $this->assertTrue($goals['complete_games']['is_default']);
        $this->assertSame(10, $goals['complete_games']['target']);
        $this->assertSame(0, $goals['complete_games']['current']);
    }

    public function test_progress_is_read_live_from_the_collection(): void
    {
        $user = User::factory()->create(['username' => 'climber']);
        $this->addGames($user, 'completed', 4);

        $achievement = Achievement::create([
            'name' => 'First Steps', 'points' => 10, 'criteria_type' => 'games_added', 'criteria_value' => 1,
        ]);
        $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);

        CollectionGoal::create(['user_id' => $user->id, 'type' => 'complete_games', 'target' => 8]);

        $goals = collect($this->getJson("/api/v1/users/{$user->username}/collection-goals")->json('data'))->keyBy('type');

        $this->assertSame(4, $goals['complete_games']['current']);
        $this->assertSame(8, $goals['complete_games']['target']);
        $this->assertSame(50, $goals['complete_games']['percent']);
        $this->assertFalse($goals['complete_games']['done']);
        $this->assertFalse($goals['complete_games']['is_default']);

        $this->assertSame(1, $goals['unlock_achievements']['current']);
    }

    /**
     * The backlog goal counts *down* — its bar fills as the pile shrinks, and
     * it completes when you're at or under the target.
     */
    public function test_the_backlog_goal_is_satisfied_by_being_under_target(): void
    {
        $user = User::factory()->create(['username' => 'tidy']);
        $this->addGames($user, 'backlog', 3);
        CollectionGoal::create(['user_id' => $user->id, 'type' => 'shrink_backlog', 'target' => 5]);

        $goals = collect($this->getJson("/api/v1/users/{$user->username}/collection-goals")->json('data'))->keyBy('type');

        $this->assertSame(3, $goals['shrink_backlog']['current']);
        $this->assertTrue($goals['shrink_backlog']['done']);
        $this->assertSame(100, $goals['shrink_backlog']['percent']);
    }

    public function test_setting_a_goal_overwrites_rather_than_accumulates(): void
    {
        $user = User::factory()->create(['username' => 'setter']);
        Sanctum::actingAs($user);

        $this->putJson('/api/v1/me/collection-goals', [
            'goals' => [['type' => 'complete_games', 'target' => 20]],
        ])->assertStatus(200);

        $this->putJson('/api/v1/me/collection-goals', [
            'goals' => [['type' => 'complete_games', 'target' => 35]],
        ])->assertStatus(200);

        $this->assertSame(1, CollectionGoal::where('user_id', $user->id)->count());
        $this->assertSame(35, CollectionGoal::where('user_id', $user->id)->value('target'));
    }

    public function test_unknown_goal_types_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/v1/me/collection-goals', [
            'goals' => [['type' => 'become_famous', 'target' => 5]],
        ])->assertStatus(422);
    }

    public function test_goals_are_hidden_on_a_private_profile(): void
    {
        $user = User::factory()->create([
            'username' => 'hermit',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        $this->getJson("/api/v1/users/{$user->username}/collection-goals")->assertStatus(403);
    }
}
