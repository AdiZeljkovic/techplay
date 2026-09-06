<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Comment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * A comment held for moderation has to say it was held.
 *
 * The first three comments from a new member wait for an editor, and the
 * listing serves approved comments only — so a held comment is invisible the
 * moment it is written. That is the intended flow. What was missing is the
 * only thing standing between it and "the site ate what I wrote".
 *
 * The screen read `status` off the comment object, where it has never been:
 * the endpoint answers with a CommentResource plus `additional`, so the body
 * is { data: {…the comment}, message, status } and the resource carries no
 * status field at all. Every held comment therefore took the success branch. A
 * reader posted, was told it worked, refreshed, found nothing, and reported
 * the site as broken — reasonably, since nothing had told him otherwise.
 *
 * So this pins the shape rather than the wording: `status` and `message` sit
 * beside `data`, and a held comment is not described as posted.
 */
class HeldCommentSaysSoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Back to being nobody.
     *
     * `actingAs` lasts for the rest of the test, so a plain getJson after one
     * is still signed in as that user — which is how a leak test came to pass
     * a comment to its own author and call it a stranger.
     */
    private function asGuest(): void
    {
        $this->app->get('auth')->forgetGuards();
    }

    private function comment(User $user, Article $article, string $content): TestResponse
    {
        return $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_id' => $article->id,
            'commentable_type' => 'article',
            'content' => $content,
        ]);
    }

    /**
     * Three approved comments already, so the next one is not on probation.
     *
     * Backdated, because posting is refused within fifteen seconds of the
     * author's last comment. Left at `now()` these history rows made the very
     * next request a 429, and the test failed on a cooldown it was not about.
     */
    private function settled(User $user, Article $article): void
    {
        foreach (range(1, 3) as $n) {
            $comment = Comment::create([
                'user_id' => $user->id,
                'commentable_id' => $article->id,
                'commentable_type' => Article::class,
                'content' => "An earlier comment number {$n}.",
                'status' => 'approved',
            ]);

            $comment->forceFill(['created_at' => now()->subDays($n)])->saveQuietly();
        }
    }

    public function test_a_new_members_comment_is_held_and_says_so(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);

        $response = $this->comment($user, $article, 'My very first comment on this site.');

        $response->assertSuccessful();

        // Beside `data`, not inside it. This is the line the screen got wrong.
        $response->assertJsonPath('status', 'pending');
        $this->assertNotEmpty($response->json('message'));

        // And it must not read as a success, whatever words are chosen.
        $this->assertStringNotContainsStringIgnoringCase(
            'posted successfully',
            (string) $response->json('message'),
            'A comment waiting for an editor was described as posted.'
        );

        $this->assertSame('pending', Comment::latest('id')->first()->status);
    }

    /** And once the member is settled, it goes straight up and says that. */
    public function test_a_settled_members_comment_is_published(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);
        $this->settled($user, $article);

        $response = $this->comment($user, $article, 'My fourth comment, which should go straight up.');

        $response->assertSuccessful();
        $response->assertJsonPath('status', 'approved');
        $this->assertSame('approved', Comment::latest('id')->first()->status);
    }

    /**
     * Two links are held for a different reason, and are told a different thing.
     *
     * Both reasons used to arrive as one sentence about new members, which is
     * wrong and unhelpful for somebody who has been here a year.
     */
    public function test_a_comment_with_two_links_is_held_for_its_own_reason(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);
        $this->settled($user, $article);

        $response = $this->comment(
            $user,
            $article,
            'Look at https://example.com and also https://example.org for more.'
        );

        $response->assertSuccessful();
        $response->assertJsonPath('status', 'pending');

        $message = (string) $response->json('message');

        $this->assertStringContainsStringIgnoringCase('link', $message);
        $this->assertStringNotContainsStringIgnoringCase(
            'first three',
            $message,
            'A settled member was told their comment was held because they are new.'
        );
    }

    /** A held comment stays off the page for everybody who did not write it. */
    public function test_a_held_comment_does_not_appear_to_other_people(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);

        $this->comment($user, $article, 'My very first comment on this site.')->assertSuccessful();

        // A passer-by.
        $this->asGuest();
        $thread = $this->getJson("/api/v1/comments/article/{$article->id}")->assertOk()->json('data');
        $this->assertSame([], $thread ?? [], 'A signed-out reader was shown a comment awaiting review.');

        // And a different member, who must not see it either.
        $stranger = User::factory()->create();
        $thread = $this->actingAs($stranger)
            ->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data');

        $this->assertSame([], $thread ?? [], 'A held comment leaked to another member.');
    }

    /**
     * But its author sees it, marked.
     *
     * Being told a comment is under review and then shown a thread without it
     * reads as the site having lost it — which is what was reported. The
     * queue only feels like a queue if you can see your place in it.
     */
    public function test_the_author_sees_their_own_held_comment(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);

        $this->comment($user, $article, 'My very first comment on this site.')->assertSuccessful();

        $thread = $this->actingAs($user)
            ->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $thread);
        $this->assertTrue($thread[0]['is_pending'], 'The author sees it, but not that it is still waiting.');
    }

    /** The same rule applies to a reply, at every depth the thread draws. */
    public function test_the_author_sees_their_own_held_reply(): void
    {
        $author = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);
        $this->settled($author, $article);

        $parent = Comment::create([
            'user_id' => User::factory()->create()->id,
            'commentable_id' => $article->id,
            'commentable_type' => Article::class,
            'content' => 'Somebody else started this.',
            'status' => 'approved',
        ]);

        $held = Comment::create([
            'user_id' => $author->id,
            'commentable_id' => $article->id,
            'commentable_type' => Article::class,
            'parent_id' => $parent->id,
            'content' => 'A reply that is waiting.',
            'status' => 'pending',
        ]);

        $seenByAuthor = $this->actingAs($author)
            ->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data.0.replies');

        $this->assertCount(1, $seenByAuthor);
        $this->assertSame($held->id, $seenByAuthor[0]['id']);
        $this->assertTrue($seenByAuthor[0]['is_pending']);

        $this->asGuest();
        $seenByStranger = $this->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data.0.replies');

        $this->assertSame([], $seenByStranger ?? [], 'A held reply leaked to everyone else.');
    }

    /**
     * A comment a moderator called spam stays gone, from its author too.
     *
     * Showing a spammer which of their posts were caught is a lesson in what
     * gets through. `pending` is a queue; `spam` is a decision.
     */
    public function test_a_spam_comment_stays_hidden_from_its_author(): void
    {
        $user = User::factory()->create();
        $article = Article::factory()->create(['status' => 'published']);

        Comment::create([
            'user_id' => $user->id,
            'commentable_id' => $article->id,
            'commentable_type' => Article::class,
            'content' => 'Something a moderator threw out.',
            'status' => 'spam',
        ]);

        $thread = $this->actingAs($user)
            ->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data');

        $this->assertSame([], $thread ?? []);
    }
}
