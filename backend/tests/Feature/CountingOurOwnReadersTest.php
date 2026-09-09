<?php

namespace Tests\Feature;

use App\Models\AnalyticsBreakdown;
use App\Models\AnalyticsDaily;
use App\Models\AnalyticsEvent;
use App\Services\AnalyticsCollector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The site counts its own readers, including the ones who said no.
 *
 * Google Analytics reported 11 active users on 8 September 2026 against 1,568
 * distinct clients that had actually run the tag, because Consent Mode counts
 * only the 2-7% who press Accept. This is the count of everybody — and the
 * reason it needs no consent is that it stores no identifier: a visitor is a
 * hash of address, user agent and a salt that changes nightly.
 *
 * These tests pin the parts that would fail quietly. A visitor hash that
 * stopped rotating, a bot rule that started counting Googlebot as a reader, a
 * rollup that added to yesterday instead of rebuilding it — none of those
 * throws. They just make the number wrong, in a report that goes to agencies.
 */
class CountingOurOwnReadersTest extends TestCase
{
    use RefreshDatabase;

    private function hit(array $params = [], string $ip = '1.2.3.4', string $ua = self::CHROME, bool $hints = true, ?string $country = null): ?AnalyticsEvent
    {
        return app(AnalyticsCollector::class)->record(
            array_merge(['dl' => 'https://techplay.gg/news/a-piece', 'en' => 'page_view'], $params),
            $ip,
            $ua,
            $hints,
            null,
            $country,
        );
    }

    private const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

    public function test_the_visitor_is_a_hash_and_the_address_is_never_stored(): void
    {
        $event = $this->hit([], '203.0.113.9');

        $this->assertNotNull($event);
        $this->assertSame(32, strlen($event->visitor));

        // The point of the whole design: the row must not contain the address
        // anywhere, in any column.
        $this->assertStringNotContainsString('203.0.113.9', json_encode($event->toArray()));
    }

    public function test_the_same_person_counts_once_and_two_people_count_twice(): void
    {
        $this->hit([], '203.0.113.9');
        $this->hit(['dl' => 'https://techplay.gg/news/another'], '203.0.113.9');
        $this->hit([], '198.51.100.7');

        $this->assertSame(2, AnalyticsEvent::distinct()->count('visitor'));
        $this->assertSame(3, AnalyticsEvent::count());
    }

    public function test_a_reader_who_declined_is_still_counted(): void
    {
        // gcs=G100 is Consent Mode saying no to everything. GA4 will not make
        // an active user out of this hit. We will.
        $event = $this->hit(['gcs' => 'G100']);

        $this->assertNotNull($event);
        $this->assertFalse($event->is_bot);
        $this->assertSame('G100', $event->consent);
    }

    public function test_googlebot_is_recorded_and_set_aside_rather_than_dropped(): void
    {
        $googlebot = $this->hit([], '66.249.66.1',
            'Mozilla/5.0 (Linux; Android 6.0.1) AppleWebKit/537.36 (KHTML, like Gecko) '
            .'Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        );

        $this->assertNotNull($googlebot, 'the hit is kept, so the exclusion can be shown');
        $this->assertTrue($googlebot->is_bot);
        $this->assertSame('declared', $googlebot->bot_reason);
        $this->assertSame(0, AnalyticsEvent::readers()->count());
    }

    public function test_a_client_claiming_chrome_without_client_hints_is_a_bot(): void
    {
        // Measured on 8 Sep 2026: every real Chrome and Edge has sent
        // sec-ch-ua since 2021, and the scraper pool sent none.
        $event = $this->hit([], '80.241.1.1', self::CHROME, hints: false);

        $this->assertTrue($event->is_bot);
        $this->assertSame('chrome-without-hints', $event->bot_reason);
    }

    public function test_safari_without_client_hints_is_a_reader(): void
    {
        // Safari has never sent sec-ch-ua and never claims to be Chrome. The
        // rule must not read it as a scraper.
        $event = $this->hit([], '198.51.100.7',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
            hints: false
        );

        $this->assertFalse($event->is_bot);
        $this->assertSame('Safari', $event->browser);
    }

    public function test_the_query_string_is_dropped_and_our_own_pages_are_not_a_source(): void
    {
        $event = $this->hit([
            'dl' => 'https://techplay.gg/games?page=4&utm_source=newsletter',
            'dr' => 'https://techplay.gg/news/a-piece',
        ]);

        $this->assertSame('/games', $event->path, 'a page number must not split one page into many');
        $this->assertNull($event->referrer_host, 'our own page is navigation, not a referrer');
    }

    public function test_a_referrer_is_kept_as_a_hostname_only(): void
    {
        $event = $this->hit(['dr' => 'https://www.google.com/search?q=something+someone+typed']);

        $this->assertSame('google.com', $event->referrer_host);
    }

    public function test_the_country_comes_from_cloudflare_and_not_from_the_payload(): void
    {
        // GA sends `_tu`, which looks like a country code and is not one: it
        // read "BA" on all 4,207 hits sampled, including those arriving from
        // Bing and DuckDuckGo. Reading it as geography made a panel that said
        // 100% Bosnia and meant nothing.
        $fromPayload = $this->hit(['_tu' => 'BA'], '198.51.100.7');

        $this->assertNull($fromPayload->country);

        $fromCloudflare = $this->hit([], '198.51.100.8', country: 'de');

        $this->assertSame('DE', $fromCloudflare->country);

        // Cloudflare's own words for "we do not know" and "Tor exit", neither
        // of which belongs in a list of countries.
        $this->assertNull($this->hit([], '198.51.100.9', country: 'XX')->country);
        $this->assertNull($this->hit([], '198.51.100.10', country: 'T1')->country);
    }

    public function test_a_hit_for_somebody_elses_site_is_refused(): void
    {
        $this->assertNull($this->hit(['dl' => 'https://example.com/mirror-of-us']));
        $this->assertSame(0, AnalyticsEvent::count());
    }

    public function test_the_rollup_rebuilds_a_day_instead_of_adding_to_it(): void
    {
        $this->hit(['sid' => '1', 'dt' => 'A piece | TechPlay'], '203.0.113.9', country: 'ba');
        $this->hit(['sid' => '1', 'dl' => 'https://techplay.gg/news/two'], '203.0.113.9');
        $this->hit(['sid' => '2', 'gcs' => 'G111'], '198.51.100.7');
        $this->hit([], '80.241.1.1', self::CHROME, hints: false);

        $this->artisan('analytics:rollup')->assertSuccessful();
        $this->artisan('analytics:rollup')->assertSuccessful();

        $today = AnalyticsDaily::whereDate('day', today())->firstOrFail();

        $this->assertSame(2, $today->visitors, 'running it twice must not double anybody');
        $this->assertSame(3, $today->pageviews);
        $this->assertSame(1, $today->bot_hits);
        $this->assertSame(1, $today->consented_visitors, 'so ours and GA stay comparable');

        $pages = AnalyticsBreakdown::whereDate('day', today())->where('kind', 'page')->get();

        $this->assertCount(2, $pages);
        $this->assertSame('A piece', $pages->firstWhere('value', '/news/a-piece')->label,
            'the site name on the end of every title is noise in a list of titles');

        $this->assertSame('BA', AnalyticsBreakdown::whereDate('day', today())
            ->where('kind', 'country')->value('value'));
    }

    public function test_the_ingest_endpoint_is_closed_without_the_token(): void
    {
        config(['services.analytics.ingest_token' => 'a-secret']);

        $body = ['params' => ['dl' => 'https://techplay.gg/'], 'ip' => '1.2.3.4', 'ua' => self::CHROME, 'hints' => true];

        $this->postJson('/api/v1/analytics/collect', $body)->assertNotFound();
        $this->postJson('/api/v1/analytics/collect', $body, ['X-Analytics-Token' => 'wrong'])->assertNotFound();
        $this->postJson('/api/v1/analytics/collect', $body, ['X-Analytics-Token' => 'a-secret'])->assertOk();

        $this->assertSame(1, AnalyticsEvent::count());
    }

    public function test_ingestion_is_off_rather_than_open_when_no_token_is_configured(): void
    {
        config(['services.analytics.ingest_token' => null]);

        $this->postJson('/api/v1/analytics/collect', [
            'params' => ['dl' => 'https://techplay.gg/'], 'ip' => '1.2.3.4', 'ua' => self::CHROME, 'hints' => true,
        ])->assertNotFound();

        $this->assertSame(0, AnalyticsEvent::count());
    }
}
