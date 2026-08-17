<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
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

    public function test_the_category_sitemap_points_at_hardware_not_tech(): void
    {
        $body = $this->get('/sitemap-categories.xml')->assertOk()->getContent();

        foreach (['reviews', 'benchmarks', 'guides', 'news'] as $slug) {
            $this->assertStringContainsString("/hardware/{$slug}", $body);
        }

        $this->assertStringNotContainsString('/tech/', $body);
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
}
