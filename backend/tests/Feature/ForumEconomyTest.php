<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P4 unit four: the forum and comments.
 *
 * The authorization side was done in P1. What is left is the bookkeeping —
 * reputation that only moved one way, and XP paid for writing rather than for
 * being read.
 */
class ForumEconomyTest extends TestCase
{
    use RefreshDatabase;

    private function forumCategory(): Category
    {
        return Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
    }

    private function thread(User $author): Thread
    {
        return Thread::create([
            'title' => 'A perfectly ordinary thread',
            'slug' => 'a-perfectly-ordinary-thread',
            'content' => 'Something worth discussing.',
            'author_id' => $author->id,
            'category_id' => $this->forumCategory()->id,
        ]);
    }

    public function test_deleting_a_thread_takes_back_the_reputation_it_granted(): void
    {
        $author = User::factory()->create(['forum_reputation' => 0]);

        $thread = $this->thread($author);
        $afterCreate = (int) $author->fresh()->forum_reputation;
        $this->assertGreaterThan(0, $afterCreate);

        // Posts already decremented on delete; threads did not, so a spam
        // thread stayed profitable after moderation removed it.
        $thread->delete();

        $this->assertSame(0, (int) $author->fresh()->forum_reputation);
    }

    public function test_restoring_a_deleted_post_gives_the_reputation_back(): void
    {
        $author = User::factory()->create(['forum_reputation' => 0]);
        $thread = $this->thread($author);

        $post = Post::create([
            'thread_id' => $thread->id,
            'author_id' => $author->id,
            'content' => 'A reply that is long enough to be a reply.',
        ]);

        $afterPost = (int) $author->fresh()->forum_reputation;

        $post->delete();
        $this->assertLessThan($afterPost, (int) $author->fresh()->forum_reputation);

        // A post removed by mistake and put back used to leave its author
        // permanently short.
        $post->restore();
        $this->assertSame($afterPost, (int) $author->fresh()->forum_reputation);
    }

    public function test_a_held_comment_earns_nothing_until_it_is_approved(): void
    {
        // Brand new account: probation holds the first three comments.
        $user = User::factory()->create(['xp' => 0]);
        $article = Article::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'article',
            'commentable_id' => $article->id,
            'content' => 'This is a long enough comment to qualify for XP.',
        ])->assertSuccessful();

        $comment = Comment::where('user_id', $user->id)->firstOrFail();

        $this->assertSame('pending', $comment->status);
        $this->assertSame(0, (int) $user->fresh()->xp, 'a comment nobody can see has not earned anything');

        // A moderator approves it — now it exists for other people.
        $comment->update(['status' => 'approved']);

        $this->assertGreaterThan(0, (int) $user->fresh()->xp);
    }

    public function test_flipping_a_comment_between_states_pays_only_once(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        $article = Article::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'article',
            'commentable_id' => $article->id,
            'content' => 'This is a long enough comment to qualify for XP.',
        ])->assertSuccessful();

        $comment = Comment::where('user_id', $user->id)->firstOrFail();

        $comment->update(['status' => 'approved']);
        $earned = (int) $user->fresh()->xp;

        $comment->update(['status' => 'pending']);
        $comment->update(['status' => 'approved']);
        $comment->update(['status' => 'pending']);
        $comment->update(['status' => 'approved']);

        $this->assertSame($earned, (int) $user->fresh()->xp);
    }
}
