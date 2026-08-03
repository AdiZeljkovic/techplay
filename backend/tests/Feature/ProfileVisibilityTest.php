<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function privateUser(string $username = 'hermit'): User
    {
        return User::factory()->create([
            'username' => $username,
            'profile_visibility' => User::VISIBILITY_FRIENDS,
            'xp' => 1200,
        ]);
    }

    private function befriend(User $a, User $b): void
    {
        Friendship::create(['sender_id' => $a->id, 'receiver_id' => $b->id, 'status' => 'accepted']);
    }

    public function test_public_profiles_stay_open_to_everyone(): void
    {
        $user = User::factory()->create(['username' => 'openbook']);

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertStatus(200)
            ->assertJsonPath('can_view', true)
            ->assertJsonPath('is_private', false)
            ->assertJsonStructure(['stats' => ['games_count', 'hours_played', 'friends_count']]);
    }

    public function test_a_stranger_gets_the_locked_teaser_not_the_aggregates(): void
    {
        $user = $this->privateUser();

        $response = $this->getJson("/api/v1/users/{$user->username}")->assertStatus(200);

        $response->assertJsonPath('can_view', false)
            ->assertJsonPath('is_private', true)
            ->assertJsonPath('user.username', 'hermit')
            // identity and standing survive — that's the point of the doorway
            ->assertJsonStructure(['user' => ['avatar_url', 'rank'], 'stats' => ['level', 'joined_at']])
            // …everything they own, play or wrote does not
            ->assertJsonMissingPath('collection_snapshot')
            ->assertJsonMissingPath('playing_now')
            ->assertJsonMissingPath('achievements')
            ->assertJsonMissingPath('recent_threads')
            ->assertJsonMissingPath('stats.games_count');
    }

    public function test_an_accepted_friend_sees_the_whole_profile(): void
    {
        $user = $this->privateUser();
        $friend = User::factory()->create();
        $this->befriend($friend, $user);

        Sanctum::actingAs($friend);

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertStatus(200)
            ->assertJsonPath('can_view', true)
            ->assertJsonPath('friend_status', 'accepted')
            ->assertJsonStructure(['stats' => ['games_count']]);
    }

    public function test_a_pending_request_does_not_unlock_the_profile(): void
    {
        $user = $this->privateUser();
        $stranger = User::factory()->create();
        Friendship::create(['sender_id' => $stranger->id, 'receiver_id' => $user->id, 'status' => 'pending']);

        Sanctum::actingAs($stranger);

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertStatus(200)
            ->assertJsonPath('can_view', false)
            ->assertJsonPath('friend_status', 'pending');
    }

    public function test_the_owner_always_sees_their_own_profile(): void
    {
        $user = $this->privateUser();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/users/{$user->username}")
            ->assertStatus(200)
            ->assertJsonPath('can_view', true)
            ->assertJsonPath('friend_status', 'self');
    }

    /**
     * Gating only the profile payload would leave the data one curl away.
     */
    public function test_the_aggregate_endpoints_are_gated_too(): void
    {
        $user = $this->privateUser();

        foreach ([
            "/api/v1/users/{$user->username}/collection",
            "/api/v1/users/{$user->username}/lists",
            "/api/v1/users/{$user->username}/activity",
            "/api/v1/users/{$user->username}/steam-achievements",
            "/api/v1/users/{$user->username}/recognitions",
            "/api/v1/users/{$user->username}/wrapped/2026",
        ] as $url) {
            $this->getJson($url)->assertStatus(403);
        }
    }

    public function test_the_same_endpoints_stay_open_on_a_public_profile(): void
    {
        $user = User::factory()->create(['username' => 'openbook']);

        $this->getJson("/api/v1/users/{$user->username}/collection")->assertStatus(200);
        $this->getJson("/api/v1/users/{$user->username}/activity")->assertStatus(200);
    }

    public function test_private_profiles_drop_off_the_leaderboard(): void
    {
        User::factory()->create(['username' => 'loud', 'xp' => 500]);
        $this->privateUser('quiet')->update(['xp' => 99999]);

        $response = $this->getJson('/api/v1/leaderboard?type=xp')->assertStatus(200);

        $usernames = array_column($response->json('data.entries'), 'username');
        $this->assertContains('loud', $usernames);
        $this->assertNotContains('quiet', $usernames);
    }

    public function test_private_profiles_are_not_browsable_in_member_search(): void
    {
        // Member search is built on ILIKE, which the sqlite test driver has no
        // equivalent for — this one only runs against a real PostgreSQL.
        if (\DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Member search uses ILIKE (PostgreSQL only).');
        }

        User::factory()->create(['username' => 'searchable_hero']);
        $this->privateUser('searchable_hermit');

        $response = $this->getJson('/api/v1/search/users?q=searchable')->assertStatus(200);

        $slugs = array_column($response->json('data.results') ?? $response->json('results'), 'slug');
        $this->assertContains('searchable_hero', $slugs);
        $this->assertNotContains('searchable_hermit', $slugs);
    }

    public function test_the_owner_can_flip_the_setting(): void
    {
        $user = User::factory()->create(['username' => 'flipper']);
        Sanctum::actingAs($user);

        $this->putJson('/api/v1/user/profile', ['profile_visibility' => 'friends'])->assertStatus(200);
        $this->assertTrue($user->fresh()->hasPrivateProfile());

        $this->putJson('/api/v1/user/profile', ['profile_visibility' => 'public'])->assertStatus(200);
        $this->assertFalse($user->fresh()->hasPrivateProfile());

        $this->putJson('/api/v1/user/profile', ['profile_visibility' => 'nobody'])->assertStatus(422);
    }
}
