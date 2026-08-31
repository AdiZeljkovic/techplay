<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The one file every crawler reads before it reads anything else.
 *
 * The route sat in the web group, so the session middleware ran on it and
 * every fetch came back carrying an XSRF-TOKEN and a session cookie, marked
 * `private, must-revalidate` with `Expires: -1`. That tells a crawler never to
 * keep a copy, and the Set-Cookie stops Cloudflare from holding one either.
 *
 * Googlebot asked 33 times on 31 Aug 2026 and crawled a single page that day.
 * Whatever else was limiting it, a third of a crawler's visits going to
 * "am I allowed in" is waste we were causing ourselves.
 */
class RobotsIsCacheableTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function robots_carries_no_session(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk();
        $this->assertSame([], $response->headers->getCookies(), 'robots.txt must not set cookies');
        $this->assertStringNotContainsString('XSRF-TOKEN', (string) $response->headers->get('set-cookie'));
    }

    #[Test]
    public function robots_may_be_kept_for_an_hour(): void
    {
        $cacheControl = $this->get('/robots.txt')->headers->get('cache-control');

        $this->assertStringContainsString('public', $cacheControl);
        $this->assertStringContainsString('max-age=3600', $cacheControl);
        $this->assertStringNotContainsString('private', $cacheControl);
    }

    /**
     * The content still comes from the admin panel, and still carries exactly
     * one Sitemap line pointing at the site's own hostname.
     */
    #[Test]
    public function the_admin_panel_still_writes_it(): void
    {
        SiteSetting::updateOrCreate(
            ['key' => 'seo_robots_txt_content'],
            ['value' => "User-agent: *\nDisallow: /admin/\nSitemap: https://wrong-host.example/sitemap.xml"]
        );

        $body = $this->get('/robots.txt')->getContent();

        $this->assertStringContainsString('Disallow: /admin/', $body);
        $this->assertSame(1, substr_count($body, 'Sitemap:'), 'exactly one Sitemap line');
        $this->assertStringNotContainsString('wrong-host.example', $body);
    }
}
