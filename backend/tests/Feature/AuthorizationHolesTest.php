<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\GameList;
use App\Models\Post;
use App\Models\Presence;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_a_hidden_profiles_unpublished_list_is_not_readable_by_id(): void
    {
        $owner = User::factory()->create(['profile_visibility' => User::VISIBILITY_FRIENDS]);

        $private = GameList::create([
            'user_id' => $owner->id,
            'name' => 'My quiet favourites',
            'slug' => 'my-quiet-favourites',
            'is_public' => false,
            'is_draft' => false,
        ]);

        // The hole this test was written for: the same list answered 403 at
        // /users/{name}/lists/{slug} and 200 here, with the owner's username
        // and avatar attached. Both doors agree now.
        $this->getJson("/api/v1/game-lists/{$private->id}")->assertStatus(403);
        $this->getJson("/api/v1/game-lists/{$private->id}/comments")->assertStatus(403);

        $this->actingAs($owner)->getJson("/api/v1/game-lists/{$private->id}")->assertOk();
    }

    public function test_a_published_list_opens_by_either_door_whatever_the_profile_says(): void
    {
        $owner = User::factory()->create([
            'username' => 'quietauthor',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        $published = GameList::create([
            'user_id' => $owner->id,
            'name' => 'Hidden Gems',
            'slug' => 'hidden-gems',
            'is_public' => true,
            'is_draft' => false,
        ]);

        // This used to be 403 on both, on the reasoning that a friends-only
        // profile is the stronger intent. It is not: profile visibility hides
        // aggregates — the shelf, the stats, the directory of someone's lists
        // — and has never unpublished a thing its owner chose to publish.
        // Somebody ticked "public", opened their own list, and got an error.
        $this->getJson("/api/v1/game-lists/{$published->id}")->assertOk();
        $this->getJson('/api/v1/users/quietauthor/lists/hidden-gems')->assertOk();

        // The aggregate stays shut.
        $this->getJson('/api/v1/users/quietauthor/lists')->assertStatus(403);
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
