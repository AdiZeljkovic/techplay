<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Game;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * What the forum is allowed to say about the people posting in it.
 *
 * The User model leaves `email` visible on purpose, so that a signed-in visitor
 * can read their own address on the settings page. The consequence is that any
 * endpoint serializing a User without going through a Resource publishes it.
 * /forum/categories/{slug} did exactly that, and it is the busiest read the
 * forum has and needs no sign-in — every thread author's address was being
 * served to anyone who asked. Measured on production, not inferred.
 *
 * These tests exist so the next hand that adds a list endpoint finds out here
 * rather than there. They assert on the whole response body: a field renamed or
 * nested somewhere new still fails.
 */
class ForumPrivacyTest extends TestCase
{
    use RefreshDatabase;

    private function board(): Category
    {
        return Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
    }

    private function threadBy(User $author, Category $board, ?Game $game = null): Thread
    {
        return Thread::create([
            'title' => 'A perfectly ordinary thread',
            'slug' => 'a-perfectly-ordinary-thread',
            'content' => 'Something worth discussing.',
            'author_id' => $author->id,
            'category_id' => $board->id,
            'game_id' => $game?->id,
        ]);
    }

    public function test_a_board_page_does_not_publish_the_authors_email(): void
    {
        $author = User::factory()->create(['email' => 'private.person@example.com']);
        $board = $this->board();
        $this->threadBy($author, $board);

        $response = $this->getJson("/api/v1/forum/categories/{$board->slug}");

        $response->assertOk();
        $this->assertStringNotContainsString('private.person@example.com', $response->getContent());
        $this->assertStringNotContainsString('"email"', $response->getContent());
    }

    public function test_a_board_page_still_carries_what_the_list_draws(): void
    {
        $author = User::factory()->create(['username' => 'someone']);
        $board = $this->board();
        $this->threadBy($author, $board);

        $response = $this->getJson("/api/v1/forum/categories/{$board->slug}");

        // The shape the client paginates on has to survive the reshaping.
        $response->assertOk()->assertJsonStructure([
            'category' => ['id', 'name', 'slug'],
            'threads' => [
                'data' => [['id', 'title', 'slug', 'posts_count', 'created_at', 'last_activity_at', 'author' => ['username']]],
                'current_page',
                'last_page',
            ],
        ]);

        $this->assertSame('someone', $response->json('threads.data.0.author.username'));
    }

    public function test_the_public_thread_lists_do_not_publish_emails(): void
    {
        $author = User::factory()->create(['email' => 'also.private@example.com']);
        $board = $this->board();
        $this->threadBy($author, $board);

        foreach (['/api/v1/forum/active', '/api/v1/forum/unanswered'] as $endpoint) {
            $response = $this->getJson($endpoint);

            $response->assertOk();
            $this->assertStringNotContainsString(
                'also.private@example.com',
                $response->getContent(),
                "{$endpoint} leaked an email address"
            );
        }
    }

    public function test_a_games_thread_list_does_not_publish_the_authors_email(): void
    {
        $author = User::factory()->create(['email' => 'third.private@example.com']);
        $game = Game::create(['name' => 'Some Game', 'slug' => 'some-game']);
        $this->threadBy($author, $this->board(), $game);

        $response = $this->getJson('/api/v1/games/some-game/threads');

        $response->assertOk();
        $this->assertStringNotContainsString('third.private@example.com', $response->getContent());
    }

    /**
     * Forum search is built on `to_tsvector` / `plainto_tsquery`, which only
     * exist in PostgreSQL, and the suite runs on in-memory SQLite. So this
     * cannot run here — worth knowing in its own right: /forum/search is the
     * one forum endpoint no test can cover on the current harness, and it
     * returns a 500 rather than degrading on any non-Postgres environment.
     */
    public function test_search_does_not_publish_the_authors_email(): void
    {
        if (\DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Forum search requires PostgreSQL full-text search.');
        }

        $author = User::factory()->create(['email' => 'fourth.private@example.com']);
        $this->threadBy($author, $this->board());

        $response = $this->getJson('/api/v1/forum/search?q=ordinary');

        $response->assertOk();
        $this->assertStringNotContainsString('fourth.private@example.com', $response->getContent());
    }

    /**
     * A failing write used to answer with the exception's own message, which
     * names tables, columns and paths to whoever managed to break it.
     */
    public function test_a_failed_reply_does_not_return_the_exception_message(): void
    {
        $board = $this->board();
        $thread = $this->threadBy(User::factory()->create(), $board);
        $replier = User::factory()->create();

        // Force the write to fail from underneath the controller.
        Schema::drop('posts');

        $response = $this->actingAs($replier)->postJson("/api/v1/forum/threads/{$thread->slug}/posts", [
            'content' => 'A reply that cannot be stored.',
        ]);

        $response->assertStatus(500);
        $body = $response->getContent();

        $this->assertStringNotContainsString('posts', strtolower($body));
        $this->assertStringNotContainsString('sql', strtolower($body));
        $this->assertStringNotContainsString('exception', strtolower($body));
    }
}
