<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * What every response from this host promises the browser.
 *
 * A surface scan on 7 September 2026 reported this site as missing HSTS, CSP
 * and nosniff entirely. It was reading them off a Cloudflare 403 challenge
 * page rather than off the site — three of its five findings were measured on
 * a 403 while a fourth quoted the very CSP it said did not exist. The headers
 * were there the whole time.
 *
 * The one real gap it found on the way past: this host sent no CSP at all.
 * That stays true of the admin panel, which is Livewire and Alpine and would
 * break under a policy written for documents. It is no longer true of JSON,
 * which loads nothing and can therefore carry the strictest policy there is.
 */
class SecurityHeadersTest extends TestCase
{
    public function test_every_response_carries_the_basics(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->assertNotEmpty($response->headers->get('Permissions-Policy'));
    }

    /**
     * A JSON body loads nothing, so it is allowed to load nothing.
     *
     * The point is not the API talking to itself — it is a browser that has
     * been talked into rendering a JSON response as a document. `default-src
     * 'none'` makes that inert, and cannot break a response that never had a
     * subresource to fetch.
     */
    public function test_json_carries_the_strictest_policy(): void
    {
        $csp = $this->getJson('/api/v1/settings')->headers->get('Content-Security-Policy');

        $this->assertNotNull($csp, 'A JSON response went out with no policy at all.');
        $this->assertStringContainsString("default-src 'none'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
    }

    /**
     * And it stays off the pages that need inline script to work.
     *
     * The admin is Livewire and Alpine. Handing it the JSON policy would take
     * the panel down, so the content type decides rather than the route.
     */
    public function test_html_is_left_alone(): void
    {
        $response = $this->get('/');

        if (! str_contains((string) $response->headers->get('Content-Type'), 'json')) {
            $this->assertNull(
                $response->headers->get('Content-Security-Policy'),
                'An HTML response picked up the JSON-only policy and will have lost its inline script.'
            );
        }

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}
