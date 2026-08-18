<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Deleting a piece has to take it off the site.
 *
 * Both of these were found by publishing a throwaway article, reading its
 * robots tag, deleting it — and watching techplay.gg keep serving it, title,
 * body and all, out of Redis.
 */
class DeletedContentTest extends TestCase
{
    use RefreshDatabase;

    private function author(): User
    {
        return User::factory()->create();
    }

    private function techCategory(): Category
    {
        $parent = Category::create(['name' => 'Tech', 'slug' => 'tech-root-'.uniqid(), 'type' => 'tech']);

        return Category::create([
            'name' => 'Tech News', 'slug' => 'tech-news-'.uniqid(), 'type' => 'tech', 'parent_id' => $parent->id,
        ]);
    }

    /**
     * `ArticleObserver::deleted` revalidated the listing the piece used to be in
     * and the homepage, and never touched the piece's own key — so
     * `tech.show.v2.{slug}` answered 200 for the full TTL after the row was
     * gone.
     */
    public function test_deleting_an_article_forgets_the_page_that_served_it(): void
    {
        $article = Article::factory()->create([
            'slug' => 'a-piece-that-goes-away',
            'category_id' => $this->techCategory()->id,
            'author_id' => $this->author()->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
        ]);

        // What the controller writes when the page is first requested.
        Cache::put('tech.show.v2.a-piece-that-goes-away', 'cached payload', 3600);
        Cache::put('news.show.v2.a-piece-that-goes-away', 'cached payload', 3600);
        Cache::put('reviews.show.v2.a-piece-that-goes-away', 'cached payload', 3600);

        $article->delete();

        $this->assertNull(Cache::get('tech.show.v2.a-piece-that-goes-away'));
        $this->assertNull(Cache::get('news.show.v2.a-piece-that-goes-away'));
        $this->assertNull(Cache::get('reviews.show.v2.a-piece-that-goes-away'));
    }

    /**
     * `GuideController::show` writes `guide.show.v3.{slug}`. The observer had
     * been forgetting `v2` since the bump, so it was clearing a key nobody
     * wrote — on every edit as well as every delete.
     */
    public function test_deleting_a_guide_forgets_the_key_the_controller_actually_writes(): void
    {
        $guide = Guide::create([
            'title' => 'A guide that goes away',
            'slug' => 'a-guide-that-goes-away',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => $this->author()->id,
        ]);

        Cache::put('guide.show.v3.a-guide-that-goes-away', 'cached payload', 3600);

        $guide->delete();

        $this->assertNull(Cache::get('guide.show.v3.a-guide-that-goes-away'));
    }

    public function test_editing_a_guide_also_forgets_it(): void
    {
        $guide = Guide::create([
            'title' => 'A guide that changes',
            'slug' => 'a-guide-that-changes',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => $this->author()->id,
        ]);

        Cache::put('guide.show.v3.a-guide-that-changes', 'the old text', 3600);

        $guide->update(['content' => 'the new text']);

        $this->assertNull(Cache::get('guide.show.v3.a-guide-that-changes'));
    }
}
