<?php

namespace Tests\Feature;

use App\Models\User;
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
                    'streak' => ['days', 'claimed_today'],
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
        $this->assertSame(0, $response->json('data.streak.days'));
        $this->assertFalse($response->json('data.streak.claimed_today'));
    }
}
