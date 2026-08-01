<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Friendship;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\Presence;
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
                    'user' => [
                        'id', 'username', 'display_name', 'avatar_url', 'level', 'xp', 'rank_name', 'next_rank',
                        'cover_image', 'bio', 'location', 'tagline', 'playstyle_tags',
                    ],
                    'stats' => [
                        'games_count', 'playing_count', 'backlog_count', 'completed_count',
                        'wishlist_count', 'favorites_count', 'achievements_count', 'reviews_count',
                        'hours_played', 'friends_count',
                    ],
                    'playing_now',
                    'favorites',
                    'backlog_preview',
                    'streak' => ['streak', 'claimed_today', 'next_bounty'],
                    'highlights' => ['updates_from_followed', 'releases_this_week'],
                    'recent_achievements',
                    'recent_reviews',
                    'friends_online',
                    'profile_completion' => ['percent', 'missing'],
                ],
            ]);

        // 2500 XP sits between Gold (2000 → L11) and Platinum (3500 → L15),
        // a band that costs 375 XP per level — see LevelService.
        $this->assertSame(12, $response->json('data.user.level'));
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
        $this->assertSame([], $response->json('data.recent_achievements'));
        $this->assertSame([], $response->json('data.recent_reviews'));
        $this->assertSame([], $response->json('data.friends_online'));
        $this->assertSame(0, $response->json('data.stats.hours_played'));
        $this->assertSame(0, $response->json('data.stats.friends_count'));
        $this->assertLessThan(50, $response->json('data.profile_completion.percent'));
        $this->assertNotEmpty($response->json('data.profile_completion.missing'));
    }

    public function test_hours_played_sums_the_library(): void
    {
        $user = User::factory()->create(['username' => 'grinder']);
        Sanctum::actingAs($user);

        $a = Game::create(['slug' => 'long-one', 'name' => 'Long One', 'rating' => 4]);
        $b = Game::create(['slug' => 'short-one', 'name' => 'Short One', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $a->id, 'status' => 'playing', 'hours_played' => 10]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $b->id, 'status' => 'completed', 'hours_played' => 5]);

        $this->getJson('/api/v1/me/dashboard')
            ->assertStatus(200)
            ->assertJsonPath('data.stats.hours_played', 15);
    }

    public function test_recent_reviews_exclude_drafts_and_limit_three(): void
    {
        $user = User::factory()->create(['username' => 'reviewer']);
        Sanctum::actingAs($user);

        $games = collect(range(1, 5))->map(fn ($i) => Game::create([
            'slug' => "reviewed-{$i}", 'name' => "Reviewed {$i}", 'rating' => 4,
        ]));

        // 4 published (staggered timestamps — created_at is not fillable, set after) + 1 draft
        foreach ($games->take(4) as $i => $game) {
            $rating = GameRating::create([
                'user_id' => $user->id, 'game_id' => $game->id, 'game_slug' => $game->slug,
                'rating' => 4, 'review' => "Solid pick number {$i}, would play again.",
                'is_draft' => false,
            ]);
            $rating->forceFill(['created_at' => now()->subDays(4 - $i)])->save();
        }
        GameRating::create([
            'user_id' => $user->id, 'game_id' => $games[4]->id, 'game_slug' => $games[4]->slug,
            'rating' => 2, 'review' => 'Unfinished thoughts, still a draft.', 'is_draft' => true,
        ]);

        $response = $this->getJson('/api/v1/me/dashboard')->assertStatus(200);
        $reviews = $response->json('data.recent_reviews');

        $this->assertCount(3, $reviews);
        $this->assertNotContains('reviewed-5', array_column(array_column($reviews, 'game'), 'slug'));
        $this->assertSame('reviewed-4', $reviews[0]['game']['slug']); // newest first
        $this->assertArrayHasKey('excerpt', $reviews[0]);
    }

    public function test_friends_online_only_active_presences_of_accepted_friends(): void
    {
        $user = User::factory()->create(['username' => 'social']);
        Sanctum::actingAs($user);

        $activeFriend = User::factory()->create(['username' => 'friend-live']);
        $idleFriend = User::factory()->create(['username' => 'friend-idle']);
        $pendingUser = User::factory()->create(['username' => 'not-yet']);
        $stranger = User::factory()->create(['username' => 'stranger']);

        Friendship::create(['sender_id' => $user->id, 'receiver_id' => $activeFriend->id, 'status' => 'accepted']);
        Friendship::create(['sender_id' => $idleFriend->id, 'receiver_id' => $user->id, 'status' => 'accepted']);
        Friendship::create(['sender_id' => $user->id, 'receiver_id' => $pendingUser->id, 'status' => 'pending']);

        Presence::create(['user_id' => $activeFriend->id, 'game_name' => 'Elden Ring', 'source' => 'manual', 'is_active' => true, 'started_at' => now()]);
        Presence::create(['user_id' => $idleFriend->id, 'game_name' => 'Old Session', 'source' => 'manual', 'is_active' => false, 'started_at' => now()->subDay()]);
        Presence::create(['user_id' => $pendingUser->id, 'game_name' => 'Not Friends Yet', 'source' => 'manual', 'is_active' => true, 'started_at' => now()]);
        Presence::create(['user_id' => $stranger->id, 'game_name' => 'Stranger Game', 'source' => 'manual', 'is_active' => true, 'started_at' => now()]);

        $response = $this->getJson('/api/v1/me/dashboard')->assertStatus(200);

        $online = $response->json('data.friends_online');
        $this->assertCount(1, $online);
        $this->assertSame('friend-live', $online[0]['username']);
        $this->assertSame('Elden Ring', $online[0]['game_name']);
        $this->assertSame(2, $response->json('data.stats.friends_count')); // accepted only
    }

    public function test_recent_achievements_ordered_by_unlock_desc(): void
    {
        $user = User::factory()->create(['username' => 'unlocker']);
        Sanctum::actingAs($user);

        $old = Achievement::create(['name' => 'First Steps', 'points' => 10, 'criteria_type' => 'games_added', 'criteria_value' => 1]);
        $new = Achievement::create(['name' => 'Collector', 'points' => 25, 'criteria_type' => 'games_added', 'criteria_value' => 10]);

        $user->achievements()->attach($old->id, ['unlocked_at' => now()->subWeek()]);
        $user->achievements()->attach($new->id, ['unlocked_at' => now()]);

        $response = $this->getJson('/api/v1/me/dashboard')->assertStatus(200);
        $achievements = $response->json('data.recent_achievements');

        $this->assertCount(2, $achievements);
        $this->assertSame('Collector', $achievements[0]['name']);
        $this->assertSame(25, $achievements[0]['points']);
    }

    public function test_profile_completion_reflects_filled_signals(): void
    {
        $fresh = User::factory()->create(['username' => 'blank', 'avatar_url' => null, 'bio' => null]);
        Sanctum::actingAs($fresh);
        $freshPercent = $this->getJson('/api/v1/me/dashboard')->json('data.profile_completion.percent');

        $filled = User::factory()->create([
            'username' => 'complete-ish',
            'avatar_url' => 'https://img.test/a.jpg',
            'bio' => 'I play everything.',
            'location' => 'Sarajevo',
        ]);
        Sanctum::actingAs($filled);
        $response = $this->getJson('/api/v1/me/dashboard');
        $filledPercent = $response->json('data.profile_completion.percent');

        $this->assertGreaterThan($freshPercent, $filledPercent);
        $this->assertNotContains('bio', array_column($response->json('data.profile_completion.missing'), 'key'));
    }

    public function test_cover_image_is_returned_as_full_url(): void
    {
        $user = User::factory()->create(['username' => 'bannered', 'cover_image' => 'covers/banner.jpg']);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me/dashboard')->assertStatus(200);
        $this->assertStringContainsString('storage/covers/banner.jpg', $response->json('data.user.cover_image'));

        $bare = User::factory()->create(['username' => 'bare']);
        Sanctum::actingAs($bare);
        $this->assertNull($this->getJson('/api/v1/me/dashboard')->json('data.user.cover_image'));
    }

    public function test_backlog_suggestion_prefers_the_best_taste_match(): void
    {
        $user = User::factory()->create(['username' => 'backlogger']);
        Sanctum::actingAs($user);

        $played = Game::create([
            'slug' => 'played-rpg', 'name' => 'Played RPG', 'rating' => 4.5,
            'genre_names' => ['RPG'], 'platform_names' => ['PC'], 'has_description' => true,
        ]);
        $match = Game::create([
            'slug' => 'backlog-rpg', 'name' => 'Backlog RPG', 'rating' => 4.6,
            'genre_names' => ['RPG'], 'platform_names' => ['PC'], 'has_description' => true,
        ]);
        $mismatch = Game::create([
            'slug' => 'backlog-racing', 'name' => 'Backlog Racing', 'rating' => 4.9,
            'genre_names' => ['Racing'], 'platform_names' => ['PC'], 'has_description' => true,
        ]);

        UserGame::create(['user_id' => $user->id, 'game_id' => $played->id, 'status' => 'completed']);
        UserGame::create(['user_id' => $user->id, 'game_id' => $mismatch->id, 'status' => 'backlog']);
        UserGame::create(['user_id' => $user->id, 'game_id' => $match->id, 'status' => 'backlog']);

        $response = $this->getJson('/api/v1/me/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.backlog_suggestion.slug', 'backlog-rpg');
        $this->assertGreaterThan(0, $response->json('data.backlog_suggestion.match_percent'));
    }

    public function test_completed_this_month_counts_only_the_current_month(): void
    {
        $user = User::factory()->create(['username' => 'finisher']);
        Sanctum::actingAs($user);

        $a = Game::create(['slug' => 'done-now', 'name' => 'Done Now', 'rating' => 4]);
        $b = Game::create(['slug' => 'done-before', 'name' => 'Done Before', 'rating' => 4]);

        UserGame::create(['user_id' => $user->id, 'game_id' => $a->id, 'status' => 'completed', 'completed_at' => now()]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $b->id, 'status' => 'completed', 'completed_at' => now()->subMonths(2)]);

        $this->getJson('/api/v1/me/dashboard')
            ->assertStatus(200)
            ->assertJsonPath('data.stats.completed_this_month', 1);
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
