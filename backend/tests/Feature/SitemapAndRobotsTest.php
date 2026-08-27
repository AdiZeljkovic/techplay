<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The two files a search engine reads before it reads anything else.
 *
 * Both were wrong on 17 Aug 2026, and both had been wrong quietly:
 *
 *   - robots.txt announced `Sitemap: https://api-beta.techplay.gg/sitemap.xml`.
 *     That is the API's hostname. A crawler following it lands on a different
 *     host whose index points back at techplay.gg, and a sitemap listing URLs
 *     on a host other than its own is refused unless the two are verified as
 *     one property. One env fallback was very likely costing the entire
 *     166,000-URL sitemap.
 *
 *   - The category sitemap emitted /tech/benchmarks, /tech/guides,
 *     /tech/reviews and /tech/news. The section moved to /hardware; all four
 *     answered 404 in production.
 *
 * Neither failure is visible from the site, which is why they lasted. These
 * tests are the visibility.
 *
 * The comma-separated FRONTEND_URL case is covered in ConfigDisciplineTest,
 * against the real configured value — in development it genuinely holds three
 * origins, so that assertion has something to bite on. Re-testing it here would
 * mean re-evaluating a copy of the config expression, which proves nothing.
 */
class SitemapAndRobotsTest extends TestCase
{
    use RefreshDatabase;

    public function test_robots_announces_the_sitemap_on_the_sites_own_host(): void
    {
        config(['app.site_url' => 'https://techplay.gg', 'app.url' => 'https://api-beta.techplay.gg']);

        $body = $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertStringContainsString('Sitemap: https://techplay.gg/sitemap.xml', $body);
        $this->assertStringNotContainsString('api-beta', $body);
    }

    /**
     * A stored line is the one that would survive the fix, so it is replaced
     * rather than left alone.
     */
    public function test_a_stored_sitemap_line_is_replaced_not_kept(): void
    {
        config(['app.site_url' => 'https://techplay.gg']);

        SiteSetting::updateOrCreate(['key' => 'seo_robots_txt_content'], [
            'value' => "User-agent: *\nAllow: /\n\nSitemap: https://api-beta.techplay.gg/sitemap.xml",
        ]);

        $body = $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertSame(1, substr_count($body, 'Sitemap:'));
        $this->assertStringContainsString('Sitemap: https://techplay.gg/sitemap.xml', $body);
        $this->assertStringNotContainsString('api-beta', $body);
    }

    /**
     * Seeds one published article into a category so it has something to be
     * about.
     *
     * The DB slug is not the URL segment: /hardware/news is `tech-tech-news`,
     * because the section prefix is `tech` and the category is called
     * `tech-news`. Reading that wrong makes a category with 39 articles look
     * empty.
     */
    private function articleIn(string $dbSlug, string $type): void
    {
        $category = Category::firstOrCreate(
            ['slug' => $dbSlug],
            ['name' => $dbSlug, 'type' => $type],
        );

        Article::create([
            'title' => "Something in {$dbSlug}",
            'slug' => "something-in-{$dbSlug}",
            'status' => 'published',
            'published_at' => now()->subHour(),
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'content' => '<p>Body enough to be a story.</p>',
        ]);
    }

    public function test_the_category_sitemap_points_at_hardware_not_tech(): void
    {
        foreach (['tech-reviews', 'tech-benchmarks', 'tech-guides', 'tech-tech-news'] as $dbSlug) {
            $this->articleIn($dbSlug, 'tech');
        }

        $body = $this->get('/sitemap-categories.xml')->assertOk()->getContent();

        foreach (['reviews', 'benchmarks', 'guides', 'news'] as $slug) {
            $this->assertStringContainsString("/hardware/{$slug}", $body);
        }

        $this->assertStringNotContainsString('/tech/', $body);
    }

    /**
     * An archive with nothing in it is not worth submitting.
     *
     * /reviews/retro, /hardware/benchmarks and /hardware/guides were all in
     * this file with zero articles behind them, and their pages answer
     * noindex — so the sitemap was asking Google to fetch three URLs that turn
     * it away on arrival. Counted rather than listed, so a category that fills
     * up comes back on the next generation without anybody remembering it.
     */
    public function test_an_empty_category_is_not_submitted(): void
    {
        $this->articleIn('news-gaming', 'news');

        $body = $this->get('/sitemap-categories.xml')->assertOk()->getContent();

        $this->assertStringContainsString('/news/gaming', $body);
        $this->assertStringNotContainsString('/news/consoles', $body);
        $this->assertStringNotContainsString('/reviews/retro', $body);
    }

    public function test_the_sitemap_index_lists_children_on_the_frontend_host(): void
    {
        config(['app.site_url' => 'https://techplay.gg']);

        $body = $this->get('/sitemap.xml')->assertOk()->getContent();

        // Every child has to sit on the same host as the URLs it contains,
        // or the index is as cross-domain as the robots line was.
        preg_match_all('/<loc>(.*?)<\/loc>/', $body, $matches);

        $this->assertNotEmpty($matches[1], 'the sitemap index listed nothing');

        foreach ($matches[1] as $loc) {
            $this->assertStringStartsWith('https://techplay.gg/', $loc, "child sitemap on the wrong host: {$loc}");
        }
    }

    /**
     * A page number past the catalogue is a page that does not exist.
     *
     * This returned "<urlset></urlset>" with a 200 for any number at all. It
     * went unnoticed because static files in public/ answered first — and the
     * moment those were pruned, the route began serving empty sitemaps for
     * pages 4 and 5, the very files the pruning had just removed. A crawler
     * holding an old URL would be told, with a 200, that it is still valid.
     */
    public function test_a_game_sitemap_page_past_the_catalogue_is_a_404(): void
    {
        $this->get('/sitemap-games-99.xml')->assertNotFound();
    }

    public function test_the_first_game_sitemap_page_still_answers(): void
    {
        $this->get('/sitemap-games-1.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml');
    }

    /**
     * A publication date in the future is not a news item.
     *
     * The window here was "published in the last 48 hours", expressed with only
     * a lower bound — and "later than 48 hours ago" is permanently true of any
     * future date. So one article dated 14 Nov 2026, published in August with
     * what was almost certainly a mistyped month, became the sole and permanent
     * occupant of the news feed. Google News rejects a future publication date,
     * and it rejects the feed containing it.
     *
     * Scheduling on this site is `status = 'scheduled'`, which a command flips
     * over at the appointed time, so a *published* row dated ahead is a data
     * error and never a plan.
     */
    public function test_an_article_dated_in_the_future_stays_out_of_the_news_feed(): void
    {
        $category = Category::firstOrCreate(['slug' => 'news'], ['name' => 'News', 'type' => 'news']);
        $author = User::factory()->create();

        $fresh = Article::create([
            'title' => 'Published an hour ago',
            'slug' => 'published-an-hour-ago',
            'status' => 'published',
            'published_at' => now()->subHour(),
            'category_id' => $category->id,
            'author_id' => $author->id,
            'content' => '<p>Body enough to be a story.</p>',
        ]);

        Article::create([
            'title' => 'Dated three months out',
            'slug' => 'dated-three-months-out',
            'status' => 'published',
            'published_at' => now()->addMonths(3),
            'category_id' => $category->id,
            'author_id' => $author->id,
            'content' => '<p>Body enough to be a story.</p>',
        ]);

        $body = $this->get('/sitemap-news.xml')->assertOk()->getContent();

        $this->assertStringContainsString($fresh->slug, $body);
        $this->assertStringNotContainsString('dated-three-months-out', $body);
    }

    /**
     * The index must not advertise a news feed that the future-dated article
     * was the only reason to include.
     */
    public function test_the_index_does_not_list_a_news_feed_held_open_by_a_future_date(): void
    {
        $category = Category::firstOrCreate(['slug' => 'news'], ['name' => 'News', 'type' => 'news']);
        $author = User::factory()->create();

        Article::create([
            'title' => 'Dated three months out',
            'slug' => 'only-a-future-article',
            'status' => 'published',
            'published_at' => now()->addMonths(3),
            'category_id' => $category->id,
            'author_id' => $author->id,
            'content' => '<p>Body enough to be a story.</p>',
        ]);

        $body = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringNotContainsString('sitemap-news.xml', $body);
    }
}
