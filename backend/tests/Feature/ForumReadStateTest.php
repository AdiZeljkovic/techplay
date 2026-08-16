<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Unread state — the thing that makes a forum a forum.
 *
 * Two mechanisms have to agree: a row per thread saying when you last opened
 * it, and a watermark saying when you last dismissed everything. A thread is
 * unread when its last activity is newer than both.
 */
class ForumReadStateTest extends TestCase
{
    use RefreshDatabase;

    private function board(): Category
    {
        return Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
    }

    private function thread(string $slug = 'a-thread'): Thread
    {
        return Thread::create([
            'title' => 'A perfectly ordinary thread',
            'slug' => $slug,
            'content' => 'Something worth discussing.',
            'author_id' => User::factory()->create()->id,
            'category_id' => $this->board()->id,
        ]);
    }

    public function test_a_fresh_reader_has_read_nothing(): void
    {
        $this->thread();

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/forum/reads');

        $response->assertOk()
            ->assertJson(['watermark' => null])
            ->assertJsonPath('threads', []);
    }

    public function test_opening_a_thread_records_it(): void
    {
        $thread = $this->thread();
        $reader = User::factory()->create();

        $this->actingAs($reader)
            ->postJson("/api/v1/forum/threads/{$thread->slug}/read")
            ->assertOk();

        $map = $this->actingAs($reader)->getJson('/api/v1/forum/reads')->json('threads');

        $this->assertArrayHasKey((string) $thread->id, $map);
    }

    public function test_reading_the_same_thread_twice_keeps_one_row(): void
    {
        $thread = $this->thread();
        $reader = User::factory()->create();

        $this->actingAs($reader)->postJson("/api/v1/forum/threads/{$thread->slug}/read")->assertOk();
        $this->actingAs($reader)->postJson("/api/v1/forum/threads/{$thread->slug}/read")->assertOk();

        $this->assertSame(1, DB::table('thread_reads')
            ->where('user_id', $reader->id)
            ->where('thread_id', $thread->id)
            ->count());
    }

    /**
     * The whole point of the watermark: dismissing everything must not cost one
     * write per thread.
     */
    public function test_marking_everything_read_moves_a_watermark_rather_than_writing_rows(): void
    {
        $board = $this->board();
        foreach (range(1, 5) as $i) {
            Thread::create([
                'title' => "Thread {$i}",
                'slug' => "thread-{$i}",
                'content' => 'Body.',
                'author_id' => User::factory()->create()->id,
                'category_id' => $board->id,
            ]);
        }

        $reader = User::factory()->create();

        $this->actingAs($reader)->postJson('/api/v1/forum/reads/all')->assertOk();

        $this->assertNotNull($reader->fresh()->forum_last_read_at);
        $this->assertSame(0, DB::table('thread_reads')->where('user_id', $reader->id)->count());

        $this->actingAs($reader)->getJson('/api/v1/forum/reads')
            ->assertOk()
            ->assertJsonPath('threads', []);
        $this->assertNotNull(
            $this->actingAs($reader)->getJson('/api/v1/forum/reads')->json('watermark')
        );
    }

    public function test_read_state_is_private_to_the_reader(): void
    {
        $thread = $this->thread();
        $reader = User::factory()->create();
        $stranger = User::factory()->create();

        $this->actingAs($reader)->postJson("/api/v1/forum/threads/{$thread->slug}/read")->assertOk();

        $this->assertSame(
            [],
            $this->actingAs($stranger)->getJson('/api/v1/forum/reads')->json('threads')
        );
    }

    public function test_read_state_needs_a_signed_in_reader(): void
    {
        $this->getJson('/api/v1/forum/reads')->assertStatus(401);
    }
}
