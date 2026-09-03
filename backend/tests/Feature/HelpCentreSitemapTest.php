<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What the help centre tells Google.
 *
 * A sitemap may only list URLs on the host that serves it. Every other sitemap
 * on this site is built from `config('app.site_url')` — techplay.gg — and a
 * `sitemap-help.xml` there listing help.techplay.gg addresses would be refused
 * outright unless both hosts were verified as one property. So the subdomain
 * gets its own pair, and the thing worth holding is that every `<loc>` in it
 * names the subdomain and nothing else.
 *
 * The other half is the same visibility rule the API enforces: an answer whose
 * topic is hidden has no reachable address, and handing Google a URL the site
 * does not serve is how a section earns coverage errors for pages nobody meant
 * to publish.
 */
class HelpCentreSitemapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.help_url' => 'https://help.techplay.gg']);
    }

    private function topic(string $slug, bool $published = true): HelpCategory
    {
        return HelpCategory::create([
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'sort_order' => 1,
            'is_published' => $published,
        ]);
    }

    private function answer(HelpCategory $topic, string $slug, array $attributes = []): HelpArticle
    {
        return HelpArticle::create(array_merge([
            'help_category_id' => $topic->id,
            'title' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'content' => '<p>An answer.</p>',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $attributes));
    }

    public function test_the_sitemap_lists_the_index_topics_and_answers_on_the_subdomain(): void
    {
        $topic = $this->topic('connections');
        $this->answer($topic, 'steam-library-is-not-syncing');

        $response = $this->get('/help/sitemap.xml')->assertOk();
        $xml = $response->getContent();

        $this->assertStringContainsString('<loc>https://help.techplay.gg/</loc>', $xml);
        $this->assertStringContainsString('<loc>https://help.techplay.gg/connections</loc>', $xml);
        $this->assertStringContainsString(
            '<loc>https://help.techplay.gg/connections/steam-library-is-not-syncing</loc>',
            $xml
        );

        // Not one URL on the main site. This is the whole reason the file exists
        // separately, and a single techplay.gg address in here invalidates it.
        $this->assertStringNotContainsString('techplay.gg/help', $xml);
        $this->assertSame(3, substr_count($xml, '<loc>'));
    }

    public function test_the_sitemap_leaves_out_drafts_noindex_and_answers_in_hidden_topics(): void
    {
        $visible = $this->topic('connections');
        $this->answer($visible, 'steam-library-is-not-syncing');
        $this->answer($visible, 'still-a-draft', ['status' => 'draft']);
        $this->answer($visible, 'internal-note', ['is_noindex' => true]);

        $hidden = $this->topic('withdrawn', published: false);
        $this->answer($hidden, 'published-but-unreachable');

        $xml = $this->get('/help/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('steam-library-is-not-syncing', $xml);
        $this->assertStringNotContainsString('still-a-draft', $xml);
        $this->assertStringNotContainsString('internal-note', $xml);
        $this->assertStringNotContainsString('published-but-unreachable', $xml);
        // And the hidden topic's own page is not offered either.
        $this->assertStringNotContainsString('withdrawn', $xml);
    }

    public function test_robots_names_the_subdomains_own_sitemap_and_keeps_crawlers_out_of_search(): void
    {
        $response = $this->get('/help/robots.txt')->assertOk();
        $body = $response->getContent();

        $this->assertStringContainsString('Sitemap: https://help.techplay.gg/sitemap.xml', $body);
        $this->assertStringContainsString('Allow: /', $body);
        // Search result pages are thin, endless and duplicate the answers they
        // point at; crawl budget spent on ?q= permutations is budget not spent
        // on the answers themselves.
        $this->assertStringContainsString('Disallow: /search', $body);

        // Cacheable, and without a session. The main site's robots.txt was
        // fetched 33 times in a day because the web middleware attached a
        // cookie to it, which makes it uncacheable at the edge and in the
        // crawler both.
        $this->assertStringContainsString('max-age=3600', $response->headers->get('Cache-Control'));
        $this->assertEmpty($response->headers->getCookies());
    }
}
