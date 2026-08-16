<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Thread;
use App\Models\User;
use App\Support\ForumCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * What a moderator can undo, and what the cache lets go of.
 */
class ForumModerationTest extends TestCase
{
    use RefreshDatabase;

    private function board(): Category
    {
        return Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
    }

    private function thread(User $author, Category $board): Thread
    {
        return Thread::create([
            'title' => 'A perfectly ordinary thread',
            'slug' => 'a-perfectly-ordinary-thread',
            'content' => 'Something worth discussing.',
            'author_id' => $author->id,
            'category_id' => $board->id,
        ]);
    }

    private function moderator(): User
    {
        Role::findOrCreate('Moderator', 'web');
        $user = User::factory()->create();
        $user->assignRole('Moderator');

        return $user;
    }

    public function test_deleting_a_thread_hides_it_without_destroying_it(): void
    {
        $board = $this->board();
        $thread = $this->thread(User::factory()->create(), $board);

        $this->actingAs($this->moderator())
            ->deleteJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertOk();

        // Gone from every ordinary read...
        $this->assertNull(Thread::where('slug', $thread->slug)->first());
        // ...but still there to be put back.
        $this->assertNotNull(Thread::onlyTrashed()->where('slug', $thread->slug)->first());
    }

    public function test_a_moderator_can_put_a_deleted_thread_back(): void
    {
        $author = User::factory()->create(['forum_reputation' => 0]);
        $board = $this->board();
        $thread = $this->thread($author, $board);
        $moderator = $this->moderator();

        // Opening the thread paid three, so that is the baseline to return to.
        $this->assertSame(3, (int) $author->fresh()->forum_reputation);

        $this->actingAs($moderator)->deleteJson("/api/v1/forum/threads/{$thread->slug}")->assertOk();
        $this->assertSame(0, (int) $author->fresh()->forum_reputation);

        $this->actingAs($moderator)
            ->postJson("/api/v1/forum/threads/{$thread->slug}/restore")
            ->assertOk();

        $this->assertNotNull(Thread::where('slug', $thread->slug)->first());
        // The reputation deletion took back comes back with it.
        $this->assertSame(3, (int) $author->fresh()->forum_reputation);
    }

    public function test_only_staff_can_restore(): void
    {
        $board = $this->board();
        $thread = $this->thread(User::factory()->create(), $board);
        $thread->delete();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$thread->slug}/restore")
            ->assertStatus(403);
    }

    /**
     * The old invalidation walked page numbers, so a key ending in `.tag_x`
     * survived every write. The version is part of the key now, so raising it
     * retires the tag-filtered views along with the plain ones.
     */
    public function test_clearing_a_board_retires_its_tag_filtered_pages_too(): void
    {
        $plain = ForumCache::categoryKey('general', 1);
        $tagged = ForumCache::categoryKey('general', 1, 'hdr');

        ForumCache::forgetCategory('general');

        $this->assertNotSame($plain, ForumCache::categoryKey('general', 1));
        $this->assertNotSame($tagged, ForumCache::categoryKey('general', 1, 'hdr'));
    }
}
