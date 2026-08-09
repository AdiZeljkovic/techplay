<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Clan;
use App\Models\ClanMember;
use App\Models\GameList;
use App\Models\Post;
use App\Models\Presence;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Regression cover for the authorization holes found in the August 2026 route
 * audit. Each test names the thing that was actually reachable, because these
 * are the failures that come back quietly: a guard is dropped during a
 * refactor, everything still renders, and nobody notices until the data is
 * already out.
 */
class AuthorizationHolesTest extends TestCase
{
    use RefreshDatabase;

    private function privateClanCategory(User $owner): Category
    {
        $clan = Clan::create([
            'name' => 'Night Watch',
            'slug' => 'night-watch',
            'tag' => 'NW',
            'owner_id' => $owner->id,
            'is_public' => false,
        ]);

        ClanMember::create([
            'clan_id' => $clan->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        return Category::create([
            'name' => 'Night Watch HQ',
            'slug' => 'night-watch-hq',
            'type' => 'forum',
            'clan_id' => $clan->id,
            'is_private' => true,
        ]);
    }

    /* ── private clan forums ──────────────────────────────────────────── */

    public function test_a_private_clan_thread_is_not_readable_by_slug(): void
    {
        // showThread bumps a Redis view counter, and the suite has no Redis.
        Redis::shouldReceive('incr')->zeroOrMoreTimes()->andReturn(1);

        $member = User::factory()->create();
        $category = $this->privateClanCategory($member);

        $thread = Thread::create([
            'title' => 'Raid plan for Friday',
            'slug' => 'raid-plan-for-friday',
            'content' => 'We hit the vault at 21:00.',
            'author_id' => $member->id,
            'category_id' => $category->id,
        ]);

        // Anonymous, and a logged-in outsider: both used to get the full
        // thread and every post in it.
        $this->getJson("/api/v1/forum/threads/{$thread->slug}")->assertStatus(404);

        $outsider = User::factory()->create();
        $this->actingAs($outsider)
            ->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertStatus(404);
    }

    public function test_a_clan_member_still_reads_their_own_private_forum(): void
    {
        // Separate test on purpose: the sanctum guard caches the resolved user
        // for the lifetime of a test, so a second actingAs() in the same method
        // does not take effect and the assertion would be meaningless.
        Redis::shouldReceive('incr')->zeroOrMoreTimes()->andReturn(1);

        $member = User::factory()->create();
        $category = $this->privateClanCategory($member);

        $thread = Thread::create([
            'title' => 'Raid plan for Friday',
            'slug' => 'raid-plan-for-friday',
            'content' => 'We hit the vault at 21:00.',
            'author_id' => $member->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($member)
            ->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertOk();
    }

    public function test_an_outsider_cannot_post_into_a_private_clan_category(): void
    {
        $member = User::factory()->create();
        $category = $this->privateClanCategory($member);
        $outsider = User::factory()->create();

        $this->actingAs($outsider)->postJson('/api/v1/forum/threads', [
            'title' => 'Hello from outside',
            'content' => 'Category ids are just integers.',
            'category_id' => $category->id,
        ])->assertStatus(422);

        $this->assertDatabaseMissing('threads', ['author_id' => $outsider->id]);
    }

    // Forum search is covered by restrictToVisibleCategories, but it cannot be
    // exercised here: the query uses Postgres to_tsvector and the suite runs on
    // in-memory SQLite.

    /* ── clans ────────────────────────────────────────────────────────── */

    public function test_a_private_clan_is_not_readable_by_slug(): void
    {
        $owner = User::factory()->create();
        $this->privateClanCategory($owner);

        $this->getJson('/api/v1/clans/night-watch')->assertStatus(404);
        $this->actingAs($owner)->getJson('/api/v1/clans/night-watch')->assertOk();
    }

    public function test_a_non_member_cannot_write_into_a_clans_activity_feed(): void
    {
        $owner = User::factory()->create();
        $this->privateClanCategory($owner);
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->deleteJson('/api/v1/clans/night-watch/leave')
            ->assertStatus(403);

        $this->assertDatabaseMissing('clan_activities', ['user_id' => $stranger->id]);
    }

    /* ── the Discord bot surface ──────────────────────────────────────── */

    public function test_discord_presence_requires_the_bot_secret(): void
    {
        config(['services.discord.bot_secret' => 'the-real-secret']);

        $victim = User::factory()->create(['discord_id' => '1234567890']);

        $this->postJson('/api/v1/discord/presence', [
            'discord_id' => '1234567890',
            'game_name' => 'Something they are not playing',
        ])->assertStatus(401);

        $this->assertDatabaseMissing('presences', ['user_id' => $victim->id]);

        $this->withHeaders(['X-Discord-Bot-Token' => 'the-real-secret'])
            ->postJson('/api/v1/discord/presence', [
                'discord_id' => '1234567890',
                'game_name' => 'Helldivers 2',
            ])->assertOk();
    }

    public function test_discord_user_lookup_is_not_a_public_correlation_oracle(): void
    {
        config(['services.discord.bot_secret' => 'the-real-secret']);
        User::factory()->create(['discord_id' => '999888777']);

        $this->getJson('/api/v1/discord/user/999888777')->assertStatus(401);
    }

    /* ── money ────────────────────────────────────────────────────────── */

    public function test_a_subscription_cannot_be_activated_without_paypal_confirming_it(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/subscriptions/activate', [
            'subscriptionID' => 'I-MADE-THIS-UP',
        ])->assertStatus(422);

        $this->assertNull($user->fresh()->subscription_ends_at);
    }

    /* ── email verification ───────────────────────────────────────────── */

    public function test_an_unsigned_verification_link_does_not_verify_an_email(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        $hash = sha1($user->getEmailForVerification());

        // The sha1 of an email address used to be the entire secret.
        $this->get("/api/v1/email/verify/{$user->id}/{$hash}")->assertStatus(403);
        $this->assertNull($user->fresh()->email_verified_at);

        // The link Laravel actually mails still works.
        $signed = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->id,
            'hash' => $hash,
        ]);

        $this->get($signed)->assertRedirect();
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_registration_does_not_hand_out_a_token_before_verification(): void
    {
        config(['services.turnstile.enabled' => false]);

        $response = $this->postJson('/api/v1/auth/register', [
            'username' => 'newcomer',
            'email' => 'newcomer@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated();
        $this->assertNull($response->json('data.access_token'));
        $this->assertTrue($response->json('data.requires_verification'));
    }

    /* ── profile privacy ──────────────────────────────────────────────── */

    public function test_a_hidden_profiles_list_is_not_readable_by_id(): void
    {
        $owner = User::factory()->create(['profile_visibility' => User::VISIBILITY_FRIENDS]);

        $list = GameList::create([
            'user_id' => $owner->id,
            'name' => 'My quiet favourites',
            'slug' => 'my-quiet-favourites',
            'is_public' => true,
            'is_draft' => false,
        ]);

        // 403 at /users/{name}/lists/{slug} but 200 here, with the owner's
        // username and avatar attached.
        $this->getJson("/api/v1/game-lists/{$list->id}")->assertStatus(403);
        $this->getJson("/api/v1/game-lists/{$list->id}/comments")->assertStatus(403);

        $this->actingAs($owner)->getJson("/api/v1/game-lists/{$list->id}")->assertOk();
    }

    public function test_presence_respects_profile_privacy(): void
    {
        $user = User::factory()->create([
            'username' => 'quietone',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        Presence::create([
            'user_id' => $user->id,
            'game_name' => 'Elden Ring',
            'source' => 'manual',
            'is_active' => true,
            'started_at' => now(),
        ]);

        // Null rather than 403 — a refusal confirms the account is private.
        $this->getJson('/api/v1/presence/quietone')
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    /* ── the forum solution payout ────────────────────────────────────── */

    public function test_marking_a_solution_pays_out_only_once(): void
    {
        $asker = User::factory()->create();
        $answerer = User::factory()->create(['forum_reputation' => 0]);

        $category = Category::create([
            'name' => 'Help', 'slug' => 'help', 'type' => 'forum',
        ]);

        $thread = Thread::create([
            'title' => 'How do I beat Malenia',
            'slug' => 'how-do-i-beat-malenia',
            'content' => 'She keeps healing off me.',
            'author_id' => $asker->id,
            'category_id' => $category->id,
        ]);

        $post = Post::create([
            'thread_id' => $thread->id,
            'author_id' => $answerer->id,
            'content' => 'Bleed build, and learn the waterfowl dance timing.',
        ]);

        $url = "/api/v1/forum/threads/{$thread->slug}/posts/{$post->id}/solution";

        // Baseline after the post exists — PostObserver already credits 5 for
        // writing it. What is measured here is the solution payout alone.
        $before = (int) $answerer->fresh()->forum_reputation;

        // mark → unmark → mark. The toggle used to pay on every mark.
        $this->actingAs($asker)->postJson($url)->assertOk();
        $this->actingAs($asker)->postJson($url)->assertOk();
        $this->actingAs($asker)->postJson($url)->assertOk();

        $this->assertSame($before + 10, (int) $answerer->fresh()->forum_reputation);
    }
}
