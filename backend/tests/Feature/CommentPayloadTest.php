<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Comment;
use App\Models\Rank;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * What a comment thread is allowed to send.
 *
 * The endpoint used to hand back the general UserResource for every comment
 * *and every reply* — twenty fields, of which the thread draws three and a rank
 * badge. It loads up to a hundred replies per comment, ten comments to a page,
 * so the surplus multiplied. Measured against a real production response:
 * 2591 bytes became 1406, about 592 bytes saved per author.
 *
 * This test is a fence. It fails if somebody swaps the lean resource back for
 * the full one, or adds a field to it out of habit.
 */
class CommentPayloadTest extends TestCase
{
    use RefreshDatabase;

    private function thread(): array
    {
        $rank = Rank::create(['name' => 'Noob', 'color' => '#808080', 'min_xp' => 0, 'order' => 1]);

        $author = User::factory()->create(['rank_id' => $rank->id]);
        $article = Article::factory()->create(['status' => 'published']);

        $parent = Comment::create([
            'user_id' => $author->id,
            'commentable_id' => $article->id,
            'commentable_type' => Article::class,
            'content' => 'A comment.',
            'status' => 'approved',
        ]);

        Comment::create([
            'user_id' => $author->id,
            'commentable_id' => $article->id,
            'commentable_type' => Article::class,
            'parent_id' => $parent->id,
            'content' => 'A reply.',
            'status' => 'approved',
        ]);

        return [$article, $author];
    }

    public function test_a_comment_carries_only_what_the_thread_draws(): void
    {
        [$article] = $this->thread();

        $body = $this->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $body);
        $comment = $body[0];

        $this->assertEqualsCanonicalizing(
            ['id', 'content', 'created_at', 'user', 'parent_id', 'replies', 'score', 'user_vote'],
            array_keys($comment),
            'a field nobody reads is a field sent once per comment and once per reply'
        );

        // The three that were dropped, named so the failure explains itself.
        $this->assertArrayNotHasKey('created_at_human', $comment, 'the client formats the date itself');
        $this->assertArrayNotHasKey('likes_count', $comment, 'this was score under a second name');
        $this->assertArrayNotHasKey('is_liked_by_user', $comment, 'this is user_vote, and it cannot say "down"');
    }

    public function test_the_author_is_an_author_and_not_a_profile(): void
    {
        [$article] = $this->thread();

        $user = $this->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data.0.user');

        $this->assertEqualsCanonicalizing(
            ['username', 'name', 'avatar_url', 'rank', 'is_staff'],
            array_keys($user)
        );

        // Everything the general UserResource would have brought along.
        foreach (['email', 'bio', 'tagline', 'location', 'cover_image', 'xp', 'level',
            'forum_reputation', 'posts_count', 'roles', 'created_at', 'author_slug',
            'author_social_links', 'post_color', 'display_name', 'id'] as $field) {
            $this->assertArrayNotHasKey($field, $user, "a comment thread does not draw {$field}");
        }

        $this->assertEqualsCanonicalizing(['name', 'color'], array_keys($user['rank']));
    }

    /**
     * The client read `user.role` for this, and the API has never sent a `role`
     * field — so no staff comment has ever shown its badge.
     */
    public function test_staff_are_marked_as_staff(): void
    {
        [$article, $author] = $this->thread();

        $this->assertFalse(
            $this->getJson("/api/v1/comments/article/{$article->id}")->json('data.0.user.is_staff')
        );

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $author->assignRole('Editor');

        $this->assertTrue(
            $this->getJson("/api/v1/comments/article/{$article->id}")->json('data.0.user.is_staff')
        );
    }

    public function test_replies_are_shaped_the_same_way(): void
    {
        [$article] = $this->thread();

        $reply = $this->getJson("/api/v1/comments/article/{$article->id}")
            ->assertOk()
            ->json('data.0.replies.0');

        $this->assertNotNull($reply, 'the reply should come back nested');
        $this->assertEqualsCanonicalizing(
            ['username', 'name', 'avatar_url', 'rank', 'is_staff'],
            array_keys($reply['user']),
            'the saving is in the replies — there can be a hundred of them per comment'
        );
    }
}
