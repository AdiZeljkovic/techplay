<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use App\Services\CacheService;
use App\Services\RevalidationService;
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
     * and the homepage, and never touched the piece's own key — so the article's
     * own page answered 200 for the full TTL after the row was gone.
     *
     * The keys come from CacheService rather than being written out here. They
     * used to be spelled `tech.show.v2.{slug}` in this file, which is what the
     * observer cleared and what nothing wrote: the controllers had moved to
     * `v3`. So this test passed for weeks while deleting an article left its
     * page cached, and while editing one left the old copy in place — the fault
     * a journalist eventually hit on 19 Aug 2026 when a picture added after
     * publishing never appeared.
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

        // What the controllers write when the page is first requested.
        foreach (CacheService::ARTICLE_TYPES as $type) {
            Cache::put(CacheService::articleShowKey($type, 'a-piece-that-goes-away'), 'cached payload', 3600);
        }

        $article->delete();

        foreach (CacheService::ARTICLE_TYPES as $type) {
            $this->assertNull(
                Cache::get(CacheService::articleShowKey($type, 'a-piece-that-goes-away')),
                "the {$type} page outlived the article",
            );
        }
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

    /**
     * Clearing Redis was only half of it. The page stayed up on techplay.gg,
     * served out of Next's data cache with its title and body intact, because
     * nothing told the frontend the piece was gone.
     */
    public function test_deleting_content_tells_the_frontend(): void
    {
        $sent = [];
        $this->mock(RevalidationService::class, function ($mock) use (&$sent) {
            $mock->shouldReceive('revalidateArticle')->andReturnUsing(function ($slug, $category) use (&$sent) {
                $sent[] = "{$category}/{$slug}";

                return true;
            });
            $mock->shouldReceive('revalidateCategory')->andReturn(true);
            $mock->shouldReceive('revalidateHomepage')->andReturn(true);
            $mock->shouldReceive('revalidateNavigation')->andReturn(true);
            $mock->shouldReceive('revalidatePaths')->andReturn(true);
        });

        Article::factory()->create([
            'slug' => 'an-article-being-removed',
            'category_id' => $this->techCategory()->id,
            'author_id' => $this->author()->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
        ])->delete();

        Guide::create([
            'title' => 'A guide being removed',
            'slug' => 'a-guide-being-removed',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => $this->author()->id,
        ])->delete();

        $this->assertContains('hardware/an-article-being-removed', $sent);
        $this->assertContains('guides/a-guide-being-removed', $sent);
    }
}
