<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\ArticleBookmark;
use App\Models\ArticleRead;
use App\Models\Category;
use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadingTest extends TestCase
{
    use RefreshDatabase;

    private function makeArticle(string $slug = 'test-article'): Article
    {
        $category = Category::create(['name' => 'News', 'slug' => 'news-'.uniqid(), 'type' => 'news']);
        $author = User::factory()->create();

        return Article::create([
            'title' => 'Test Article',
            'slug' => $slug,
            'content' => 'Body',
            'excerpt' => 'Excerpt',
            'status' => 'published',
            'published_at' => now(),
            'category_id' => $category->id,
            'author_id' => $author->id,
        ]);
    }

    public function test_reading_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/me/reading')->assertStatus(401);
        $this->postJson('/api/v1/articles/whatever/bookmark')->assertStatus(401);
        $this->putJson('/api/v1/articles/whatever/progress', ['progress' => 10])->assertStatus(401);
    }

    public function test_bookmark_toggles_on_and_off(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $article = $this->makeArticle('bookmark-me');

        $this->postJson('/api/v1/articles/bookmark-me/bookmark')
            ->assertStatus(200)
            ->assertJsonPath('data.bookmarked', true);

        $this->assertDatabaseHas('article_bookmarks', ['user_id' => $user->id, 'article_id' => $article->id]);

        $this->postJson('/api/v1/articles/bookmark-me/bookmark')
            ->assertStatus(200)
            ->assertJsonPath('data.bookmarked', false);

        $this->assertDatabaseMissing('article_bookmarks', ['user_id' => $user->id, 'article_id' => $article->id]);
    }

    public function test_progress_only_moves_forward(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->makeArticle('long-read');

        $this->putJson('/api/v1/articles/long-read/progress', ['progress' => 60])
            ->assertJsonPath('data.progress', 60);

        // scrolling back up must not erase how far they actually got
        $this->putJson('/api/v1/articles/long-read/progress', ['progress' => 20])
            ->assertJsonPath('data.progress', 60);
    }

    public function test_continue_reading_skips_finished_articles(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $unfinished = $this->makeArticle('half-read');
        $finished = $this->makeArticle('all-read');

        ArticleRead::create(['user_id' => $user->id, 'article_id' => $unfinished->id, 'progress' => 40, 'last_read_at' => now()->subHour()]);
        ArticleRead::create(['user_id' => $user->id, 'article_id' => $finished->id, 'progress' => 100, 'last_read_at' => now()]);

        $this->getJson('/api/v1/me/reading')
            ->assertStatus(200)
            ->assertJsonPath('data.continue_reading.slug', 'half-read')
            ->assertJsonPath('data.continue_reading.progress', 40);
    }

    public function test_saved_articles_are_listed_with_a_total(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        foreach (range(1, 3) as $i) {
            ArticleBookmark::create(['user_id' => $user->id, 'article_id' => $this->makeArticle("saved-{$i}")->id]);
        }

        $response = $this->getJson('/api/v1/me/reading');

        $response->assertStatus(200)->assertJsonPath('data.saved.total', 3);
        $this->assertCount(3, $response->json('data.saved.items'));
    }

    public function test_draft_reviews_stay_private_and_earn_nothing(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        Sanctum::actingAs($user);
        $game = Game::create(['slug' => 'draft-game', 'name' => 'Draft Game', 'rating' => 4]);

        $this->postJson("/api/v1/games/{$game->slug}/ratings", [
            'rating' => 4,
            'review' => 'This is my unfinished thought about the game.',
            'is_draft' => true,
        ])->assertStatus(201);

        // hidden from the public game page
        $this->getJson("/api/v1/games/{$game->slug}/ratings")
            ->assertStatus(200)
            ->assertJsonPath('aggregate.count', 0);

        // no XP until it goes public
        $this->assertSame(0, $user->fresh()->xp);

        // and surfaced back to its author as a draft
        $this->getJson('/api/v1/me/reading')
            ->assertStatus(200)
            ->assertJsonPath('data.draft_reviews.total', 1)
            ->assertJsonPath('data.draft_reviews.items.0.slug', 'draft-game');
    }

    public function test_publishing_a_draft_awards_xp_once(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        Sanctum::actingAs($user);
        $game = Game::create(['slug' => 'publish-game', 'name' => 'Publish Game', 'rating' => 4]);

        $payload = ['rating' => 5, 'review' => 'A properly finished review of this game.'];

        $this->postJson("/api/v1/games/{$game->slug}/ratings", $payload + ['is_draft' => true]);
        $this->assertSame(0, $user->fresh()->xp);

        $this->postJson("/api/v1/games/{$game->slug}/ratings", $payload + ['is_draft' => false]);
        $xpAfterPublish = $user->fresh()->xp;
        $this->assertGreaterThan(0, $xpAfterPublish);

        // editing a published review must not pay out again
        $this->postJson("/api/v1/games/{$game->slug}/ratings", ['rating' => 4, 'review' => 'Edited after publishing, still the same review.']);
        $this->assertSame($xpAfterPublish, $user->fresh()->xp);

        $this->assertDatabaseHas('game_ratings', ['user_id' => $user->id, 'game_slug' => 'publish-game', 'is_draft' => false]);
    }
}
