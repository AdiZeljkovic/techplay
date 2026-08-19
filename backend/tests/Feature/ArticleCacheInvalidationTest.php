<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * An edit has to reach the reader.
 *
 * On 19 Aug 2026 a journalist published a news item, saw it had no picture,
 * picked one, saved, uploaded another, saved again — and the article page kept
 * showing an empty hero. Nothing had failed. The controller cached the article
 * under `news.show.v3.{slug}` and the observer, on every save, cleared
 * `news.show.v2.{slug}`. Someone had bumped the version on one side only, and
 * for an hour after any edit the site served the copy from before it.
 *
 * The listing caches had drifted the same way, which is why the feed showed the
 * picture while the article did not — the two are different keys with different
 * lifetimes, and only one of them happened to have expired.
 *
 * These tests go through the HTTP endpoints rather than asserting on key
 * strings, because a test that repeats the key is a test that drifts with it.
 */
class ArticleCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    private function publishedArticle(string $categoryType = 'news', array $attributes = []): Article
    {
        $category = Category::firstOrCreate(
            ['slug' => $categoryType.'-cache-test'],
            ['name' => ucfirst($categoryType), 'type' => $categoryType],
        );

        return Article::factory()->create(array_merge([
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'status' => 'published',
            'published_at' => now()->subMinute(),
        ], $attributes));
    }

    /**
     * The fault exactly as it was reported: read the article, add the picture,
     * read it again.
     */
    public function test_a_picture_added_after_publishing_appears_at_once(): void
    {
        $article = $this->publishedArticle('news', ['featured_image_url' => null]);

        $this->getJson("/api/v1/news/{$article->slug}")
            ->assertOk()
            ->assertJsonPath('data.featured_image_url', null);

        $article->update([
            'featured_image_url' => 'https://api-beta.techplay.gg/storage/articles/late.jpg',
            'featured_image_alt' => 'Added after publishing',
        ]);

        $this->getJson("/api/v1/news/{$article->slug}")
            ->assertOk()
            ->assertJsonPath('data.featured_image_url', 'https://api-beta.techplay.gg/storage/articles/late.jpg')
            ->assertJsonPath('data.featured_image_alt', 'Added after publishing');
    }

    /**
     * The same for a headline, and for reviews — the other section whose key had
     * drifted.
     */
    public function test_an_edited_review_serves_the_edit(): void
    {
        $article = $this->publishedArticle('reviews', ['title' => 'Before']);

        $this->getJson("/api/v1/reviews/{$article->slug}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Before');

        $article->update(['title' => 'After']);

        $this->getJson("/api/v1/reviews/{$article->slug}")
            ->assertOk()
            ->assertJsonPath('data.title', 'After');
    }

    /**
     * A new article has to show up in the listing, not an hour later.
     *
     * The old invalidation cleared three pages of one key shape; this covers the
     * plain case that it was aiming at and missing.
     */
    public function test_a_new_article_appears_in_the_listing(): void
    {
        $this->publishedArticle('news', ['title' => 'First']);

        $this->getJson('/api/v1/news')->assertOk();

        $this->publishedArticle('news', ['title' => 'Second']);

        $this->getJson('/api/v1/news')
            ->assertOk()
            ->assertSee('Second');
    }

    /**
     * Deleting has to take it out of the listing too — the case where a stale
     * cache does not merely look old but shows something that no longer exists.
     */
    public function test_a_deleted_article_leaves_the_listing(): void
    {
        $article = $this->publishedArticle('news', ['title' => 'Retracted']);

        $this->getJson('/api/v1/news')->assertOk()->assertSee('Retracted');

        $article->delete();

        $this->getJson('/api/v1/news')
            ->assertOk()
            ->assertDontSee('Retracted');
    }

    /**
     * A listing filtered by a search term is a different key, and the old
     * invalidation could not reach it: the key carries an md5 of the term, so
     * it cannot be guessed — it has to have been recorded.
     *
     * Driven through the observer rather than through `?search=`, because the
     * search itself is `ILIKE`, which PostgreSQL answers and the SQLite used by
     * these tests does not. Pinning the invalidation does not require pinning
     * the query.
     */
    public function test_saving_an_article_clears_a_search_filtered_listing(): void
    {
        $searchKey = 'news.index.'.CacheService::ARTICLE_VERSION.'.page_1.cat_all.search_'.md5('quakecon');

        CacheService::rememberListingKey('news', $searchKey);
        Cache::put($searchKey, 'the listing as it was', 3600);

        $this->publishedArticle('news', ['title' => 'Quakecon closing night']);

        $this->assertFalse(
            Cache::has($searchKey),
            'a search-filtered listing survived an article being published',
        );
    }

    /**
     * The register must not become a leak. A crawler walking `?search=` would
     * otherwise add a key per request and never remove one.
     */
    public function test_the_key_register_is_bounded_and_clears_itself(): void
    {
        for ($i = 0; $i < 520; $i++) {
            CacheService::rememberListingKey('news', "news.index.v3.page_1.cat_all.search_{$i}");
        }

        $this->assertLessThanOrEqual(500, count(Cache::get('listing-keys.news', [])));

        CacheService::forgetListings('news');

        $this->assertSame([], Cache::get('listing-keys.news', []));
    }

    /**
     * The guard that would have caught the original fault before a reader did:
     * whatever key a section writes, that is the key its invalidation clears.
     */
    public function test_every_section_clears_the_key_it_writes(): void
    {
        foreach (CacheService::ARTICLE_TYPES as $type) {
            $key = CacheService::articleShowKey($type, 'some-slug');

            Cache::put($key, 'stale', 60);
            CacheService::forgetArticle('some-slug');

            $this->assertFalse(
                Cache::has($key),
                "{$type} writes {$key} but its invalidation does not clear it",
            );
        }
    }
}
