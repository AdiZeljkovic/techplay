<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/v1/me/dashboard')->assertStatus(401);
    }

    public function test_dashboard_returns_expected_shape(): void
    {
        $user = User::factory()->create(['username' => 'dashtester', 'xp' => 2500]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me/dashboard');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'username', 'display_name', 'avatar_url', 'level', 'xp', 'rank_name', 'next_rank'],
                    'stats' => [
                        'games_count', 'playing_count', 'backlog_count', 'completed_count',
                        'wishlist_count', 'favorites_count', 'achievements_count', 'reviews_count',
                    ],
                    'playing_now',
                    'favorites',
                    'backlog_preview',
                    'streak' => ['streak', 'claimed_today', 'next_bounty'],
                    'highlights' => ['updates_from_followed', 'releases_this_week'],
                ],
            ]);

        $this->assertSame(3, $response->json('data.user.level')); // floor(2500/1000)+1
    }

    public function test_empty_account_returns_zeroed_stats_not_errors(): void
    {
        $user = User::factory()->create(['username' => 'freshuser']);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me/dashboard');

        $response->assertStatus(200);
        $this->assertSame(0, $response->json('data.stats.games_count'));
        $this->assertSame([], $response->json('data.playing_now'));
        $this->assertSame([], $response->json('data.favorites'));
        $this->assertSame([], $response->json('data.backlog_preview'));
        $this->assertSame(0, $response->json('data.streak.streak'));
        $this->assertFalse($response->json('data.streak.claimed_today'));
        $this->assertSame(0, $response->json('data.highlights.updates_from_followed'));
        $this->assertSame(0, $response->json('data.highlights.releases_this_week'));
    }

    public function test_recommendations_require_authentication(): void
    {
        $this->getJson('/api/v1/me/recommendations')->assertStatus(401);
    }

    public function test_recommendations_empty_library_returns_empty_list(): void
    {
        Sanctum::actingAs(User::factory()->create(['username' => 'norecs']));

        $response = $this->getJson('/api/v1/me/recommendations');

        $response->assertStatus(200);
        $this->assertSame([], $response->json('data'));
    }

    public function test_recommendations_score_by_genre_overlap(): void
    {
        $user = User::factory()->create(['username' => 'recsuser']);
        Sanctum::actingAs($user);

        $owned = Game::create([
            'slug' => 'owned-rpg', 'name' => 'Owned RPG', 'rating' => 4.5,
            'genre_names' => ['RPG', 'Action'], 'platform_names' => ['PC'],
            'background_image' => 'https://img.test/owned.jpg', 'has_description' => true,
        ]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $owned->id, 'status' => 'completed']);

        $match = Game::create([
            'slug' => 'great-rpg', 'name' => 'Great RPG', 'rating' => 4.8,
            'genre_names' => ['RPG'], 'platform_names' => ['PC'],
            'background_image' => 'https://img.test/match.jpg', 'has_description' => true,
        ]);
        Game::create([
            'slug' => 'racing-game', 'name' => 'Racing Game', 'rating' => 4.9,
            'genre_names' => ['Racing'], 'platform_names' => ['PC'],
            'background_image' => 'https://img.test/racing.jpg', 'has_description' => true,
        ]);

        $response = $this->getJson('/api/v1/me/recommendations');

        $response->assertStatus(200);
        $items = $response->json('data');
        $slugs = array_column($items, 'slug');

        $this->assertContains($match->slug, $slugs);           // shares a genre
        $this->assertNotContains('owned-rpg', $slugs);         // already in library
        $this->assertNotContains('racing-game', $slugs);       // no genre overlap
        $this->assertGreaterThanOrEqual(40, $items[0]['match_percent']);
        $this->assertLessThanOrEqual(99, $items[0]['match_percent']);
    }
}
