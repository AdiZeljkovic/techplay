<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A link to one reply has to land on it.
 *
 * Replies are paginated fifteen at a time, and search results, mentions and
 * quotes all point at a single post. Before this, every one of those links
 * opened the thread at the top with the post it named nowhere on screen — and
 * the client cannot work out which page holds it, because it cannot see the
 * ordering.
 */
class ForumDeepLinkTest extends TestCase
{
    use RefreshDatabase;

    private function threadWithReplies(int $count): Thread
    {
        $board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
        $author = User::factory()->create();

        $thread = Thread::create([
            'title' => 'A long conversation',
            'slug' => 'a-long-conversation',
            'content' => 'Opening post.',
            'author_id' => $author->id,
            'category_id' => $board->id,
        ]);

        foreach (range(1, $count) as $i) {
            Post::create([
                'thread_id' => $thread->id,
                'author_id' => $author->id,
                'content' => "Reply number {$i}.",
            ]);
        }

        return $thread;
    }

    public function test_asking_for_a_post_returns_the_page_that_holds_it(): void
    {
        $thread = $this->threadWithReplies(40);
        $ids = $thread->posts()->orderBy('id')->pluck('id');

        // Reply 20 of 40, at fifteen a page, is on page two.
        $target = $ids[19];

        $response = $this->getJson("/api/v1/forum/threads/{$thread->slug}?post={$target}");

        $response->assertOk();
        $this->assertSame(2, $response->json('posts.current_page'));

        $returned = collect($response->json('posts.data'))->pluck('id');
        $this->assertTrue($returned->contains($target), 'the linked reply was not on the page returned');
    }

    public function test_a_post_on_the_last_page_resolves_there(): void
    {
        $thread = $this->threadWithReplies(40);
        $target = $thread->posts()->orderByDesc('id')->value('id');

        $response = $this->getJson("/api/v1/forum/threads/{$thread->slug}?post={$target}");

        $response->assertOk();
        $this->assertSame(3, $response->json('posts.current_page'));
        $this->assertTrue(
            collect($response->json('posts.data'))->pluck('id')->contains($target)
        );
    }

    public function test_without_a_post_the_thread_opens_at_the_first_page(): void
    {
        $thread = $this->threadWithReplies(40);

        $this->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertOk()
            ->assertJsonPath('posts.current_page', 1);
    }

    /**
     * A stale or invented id should open the thread, not break it — old links
     * outlive the posts they point at.
     */
    public function test_an_unknown_post_id_falls_back_to_the_first_page(): void
    {
        $thread = $this->threadWithReplies(20);

        $this->getJson("/api/v1/forum/threads/{$thread->slug}?post=999999")
            ->assertOk()
            ->assertJsonPath('posts.current_page', 1);
    }

    /**
     * The pager the client draws depends on this being here. It was not:
     * a resource collection nested in a plain array loses its paginator meta,
     * so every thread reported one page and stopped at reply fifteen.
     */
    public function test_the_reply_list_carries_its_page_numbers(): void
    {
        $thread = $this->threadWithReplies(40);

        $this->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertOk()
            ->assertJsonStructure(['posts' => ['data', 'current_page', 'last_page', 'per_page', 'total']])
            ->assertJsonPath('posts.last_page', 3)
            ->assertJsonPath('posts.total', 40);
    }
}
