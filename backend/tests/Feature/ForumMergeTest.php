<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Folding a duplicate thread into the one that already answered it.
 *
 * The same question gets asked three times a week. Without this a moderator
 * could delete the duplicate — losing whatever had been answered in it — or
 * leave two half-conversations beside each other. Neither is moderation.
 */
class ForumMergeTest extends TestCase
{
    use RefreshDatabase;

    private Category $board;

    protected function setUp(): void
    {
        parent::setUp();
        $this->board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
    }

    private function thread(string $slug, string $title = 'A thread'): Thread
    {
        return Thread::create([
            'title' => $title,
            'slug' => $slug,
            'content' => "The opening of {$slug}.",
            'author_id' => User::factory()->create()->id,
            'category_id' => $this->board->id,
        ]);
    }

    private function moderator(): User
    {
        Role::findOrCreate('Moderator', 'web');
        $user = User::factory()->create();
        $user->assignRole('Moderator');

        return $user;
    }

    public function test_replies_move_and_the_opening_post_survives_as_one(): void
    {
        $source = $this->thread('duplicate-question', 'How do I overclock');
        $target = $this->thread('the-real-thread');

        Post::create(['thread_id' => $source->id, 'author_id' => $source->author_id, 'content' => 'An answer.']);
        Post::create(['thread_id' => $source->id, 'author_id' => $source->author_id, 'content' => 'Another answer.']);

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => $target->slug])
            ->assertOk()
            ->assertJsonPath('into', $target->slug);

        // Two replies plus the source's opening post, kept as a reply.
        $this->assertSame(3, Post::where('thread_id', $target->id)->count());
        $this->assertSame(0, Post::where('thread_id', $source->id)->count());

        $merged = Post::where('thread_id', $target->id)->orderBy('id', 'desc')->first();
        $this->assertStringContainsString('How do I overclock', $merged->content);
        $this->assertStringContainsString('The opening of duplicate-question', $merged->content);
    }

    public function test_the_source_is_hidden_rather_than_destroyed(): void
    {
        $source = $this->thread('duplicate-question');
        $target = $this->thread('the-real-thread');

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => $target->slug])
            ->assertOk();

        $this->assertNull(Thread::where('slug', 'duplicate-question')->first());
        $this->assertNotNull(Thread::onlyTrashed()->where('slug', 'duplicate-question')->first());
    }

    public function test_watchers_follow_the_conversation_they_were_following(): void
    {
        $source = $this->thread('duplicate-question');
        $target = $this->thread('the-real-thread');
        $watcher = User::factory()->create();

        DB::table('thread_watchers')->insert([
            'thread_id' => $source->id, 'user_id' => $watcher->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => $target->slug])
            ->assertOk();

        $this->assertTrue(
            DB::table('thread_watchers')->where('thread_id', $target->id)->where('user_id', $watcher->id)->exists()
        );
        $this->assertFalse(
            DB::table('thread_watchers')->where('thread_id', $source->id)->exists()
        );
    }

    /**
     * Somebody watching both threads should end up watching one, not break the
     * merge on a duplicate key.
     */
    public function test_watching_both_threads_does_not_break_the_merge(): void
    {
        $source = $this->thread('duplicate-question');
        $target = $this->thread('the-real-thread');
        $watcher = User::factory()->create();

        foreach ([$source->id, $target->id] as $threadId) {
            DB::table('thread_watchers')->insert([
                'thread_id' => $threadId, 'user_id' => $watcher->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => $target->slug])
            ->assertOk();

        $this->assertSame(1, DB::table('thread_watchers')->where('user_id', $watcher->id)->count());
    }

    public function test_a_thread_cannot_be_merged_into_itself(): void
    {
        $thread = $this->thread('only-thread');

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$thread->slug}/merge", ['into' => $thread->slug])
            ->assertStatus(422);
    }

    public function test_only_staff_can_merge(): void
    {
        $source = $this->thread('duplicate-question');
        $target = $this->thread('the-real-thread');

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => $target->slug])
            ->assertStatus(403);
    }

    public function test_merging_into_a_thread_that_does_not_exist_is_a_404(): void
    {
        $source = $this->thread('duplicate-question');

        $this->actingAs($this->moderator())
            ->postJson("/api/v1/forum/threads/{$source->slug}/merge", ['into' => 'nothing-here'])
            ->assertStatus(404);
    }
}
