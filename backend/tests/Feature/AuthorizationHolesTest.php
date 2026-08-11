<?php

namespace Tests\Feature;

use App\Models\Category;
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

    private function privateCategory(): Category
    {
        return Category::create([
            'name' => 'Night Watch HQ',
            'slug' => 'night-watch-hq',
            'type' => 'forum',
            'is_private' => true,
        ]);
    }

    /* ── private forum categories ─────────────────────────────────────── */

    public function test_a_private_category_thread_is_not_readable_by_slug(): void
    {
        // showThread bumps a Redis view counter, and the suite has no Redis.
        Redis::shouldReceive('incr')->zeroOrMoreTimes()->andReturn(1);

        $member = User::factory()->create();
        $category = $this->privateCategory();

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

    public function test_a_private_category_is_hidden_even_from_its_author(): void
    {
        // The rule changed with clans: a private category used to be readable
        // by the clan that owned it, and there is no owner left. Closed is the
        // safe reading — these were private discussions when they were written,
        // so they stay unreachable rather than becoming public.
        Redis::shouldReceive('incr')->zeroOrMoreTimes()->andReturn(1);

        $author = User::factory()->create();
        $category = $this->privateCategory();

        $thread = Thread::create([
            'title' => 'Raid plan for Friday',
            'slug' => 'raid-plan-for-friday',
            'content' => 'We hit the vault at 21:00.',
            'author_id' => $author->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($author)
            ->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertStatus(404);
    }

    public function test_nobody_can_post_into_a_private_category(): void
    {
        $member = User::factory()->create();
        $category = $this->privateCategory();
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
