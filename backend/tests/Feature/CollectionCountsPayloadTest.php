<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every shelf state the service counts has to reach the client.
 *
 * `played_count` was computed from the day the status existed and sent by
 * nobody. The library strip reads `stats.played_count`, got undefined, and
 * drew a hard `0` under "Played" — on profiles where that bucket held most of
 * the library: 185 of adi's 280 games, 176 of XLBanana47's 396. Nothing threw.
 * A count that is calculated and then dropped on the way out looks exactly
 * like a count of zero.
 *
 * So this asserts the shape rather than one field: whatever
 * `collectionCounts()` learns to count next travels too, or this fails.
 */
class CollectionCountsPayloadTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2019-05-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, string $slug, string $status): void
    {
        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game($slug)->id,
            'status' => $status,
        ]);
    }

    private function userWithShelf(): User
    {
        $user = User::factory()->create([
            'username' => 'shelfkeeper',
            'profile_visibility' => User::VISIBILITY_PUBLIC,
        ]);

        // Deliberately lopsided towards `played`, which is what a store import
        // produces and what the strip was reporting as none.
        $this->shelve($user, 'played-one', 'played');
        $this->shelve($user, 'played-two', 'played');
        $this->shelve($user, 'played-three', 'played');
        $this->shelve($user, 'backlog-one', 'backlog');
        $this->shelve($user, 'completed-one', 'completed');
        $this->shelve($user, 'playing-one', 'playing');

        return $user;
    }

    public function test_profile_payload_carries_every_count_the_service_computes(): void
    {
        $user = $this->userWithShelf();

        $stats = $this->getJson("/api/v1/users/{$user->username}")
            ->assertOk()
            ->json('stats');

        foreach (array_keys(app(ProfileService::class)->collectionCounts($user)) as $key) {
            $this->assertArrayHasKey(
                $key,
                $stats,
                "collectionCounts() computes {$key} and the profile payload drops it — the client reads it as zero."
            );
        }
    }

    public function test_played_is_reported_as_the_number_of_played_games(): void
    {
        $user = $this->userWithShelf();

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertOk()
            ->assertJsonPath('stats.played_count', 3)
            // The neighbours, so a fix that reports every bucket as the same
            // number cannot pass.
            ->assertJsonPath('stats.playing_count', 1)
            ->assertJsonPath('stats.backlog_count', 1)
            ->assertJsonPath('stats.completed_count', 1)
            ->assertJsonPath('stats.games_count', 6);
    }

    public function test_dashboard_payload_carries_played_too(): void
    {
        $user = $this->userWithShelf();

        $this->actingAs($user)
            ->getJson('/api/v1/me/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.played_count', 3)
            ->assertJsonPath('data.stats.playing_count', 1);
    }
}
