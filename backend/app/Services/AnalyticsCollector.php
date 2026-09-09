<?php

namespace App\Services;

use App\Models\AnalyticsEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Turns one Google Analytics hit into one row of ours.
 *
 * The site already relays every GA hit through `/proxy/ga` on its own hostname
 * — that was built so ad blockers could not sever the measurement. The relay
 * forwards to Google and forgets. This is the second reader on the same wire:
 * no extra script on the page, no extra request for the reader, and it sees
 * every hit rather than the 2-7% who press Accept.
 *
 * The field names are GA4's Measurement Protocol, read off the live payload
 * rather than a document: `dl` page, `dt` title, `dr` referrer, `_tu` country,
 * `ul` language, `sr` screen, `en` event, `_et` engaged milliseconds, `sid`
 * session, `gcs` consent, `uamb`/`uap` client hints.
 */
class AnalyticsCollector
{
    /**
     * Bots that say so.
     *
     * The scraper swarm blocked on 8 September never reaches here — it runs no
     * JavaScript, so it never loads gtag and never sends a hit. What does
     * reach here are the crawlers that do render: Bingbot, Applebot, and the
     * AI fetchers. They are marked rather than dropped, and every figure the
     * admin page shows says how many were set aside.
     */
    private const DECLARED = [
        'bot', 'crawl', 'spider', 'slurp', 'headless', 'preview', 'monitor',
        'uptime', 'python', 'curl', 'wget', 'scrapy', 'facebookexternalhit',
        'lighthouse', 'pagespeed', 'gtmetrix', 'chrome-lighthouse',
    ];

    /**
     * The salt that makes a visitor countable without being identifiable.
     *
     * Regenerated every night and never written down anywhere but the cache,
     * so yesterday's hashes cannot be recomputed even by us. That is the whole
     * basis for not needing consent, and it is also the reason this cannot
     * answer "did they come back last week".
     */
    public function salt(?Carbon $day = null): string
    {
        $key = 'analytics:salt:'.($day ?? now())->toDateString();

        return Cache::remember($key, now()->addDays(2), fn () => Str::random(40));
    }

    /**
     * @param  array<string, string>  $params  the hit's query string, parsed
     */
    public function record(array $params, string $ip, string $userAgent, bool $hasClientHints): ?AnalyticsEvent
    {
        $url = $params['dl'] ?? null;

        if (! $url) {
            // Every hit GA sends carries the page it happened on. One that
            // does not is not a page view of anything.
            return null;
        }

        $path = $this->path($url);

        if ($path === null) {
            return null;
        }

        [$reason] = [$this->botReason($userAgent, $hasClientHints)];

        return AnalyticsEvent::create([
            'visitor' => substr(hash('sha256', $this->salt().$ip.$userAgent), 0, 32),
            'session' => $params['sid'] ?? null,
            'event' => Str::limit($params['en'] ?? 'page_view', 39, ''),
            'path' => $path,
            'title' => isset($params['dt']) ? Str::limit($this->cleanTitle($params['dt']), 299, '') : null,
            'referrer_host' => $this->referrerHost($params['dr'] ?? null),
            'country' => $this->country($params['_tu'] ?? null),
            'language' => isset($params['ul']) ? Str::limit($params['ul'], 11, '') : null,
            'device' => $this->device($params),
            'platform' => isset($params['uap']) && $params['uap'] !== '' ? Str::limit($params['uap'], 39, '') : null,
            'browser' => $this->browser($userAgent),
            'screen_w' => $this->screenWidth($params['sr'] ?? null),
            'engagement_ms' => isset($params['_et']) && ctype_digit((string) $params['_et'])
                ? min((int) $params['_et'], 4_000_000)
                : null,
            'consent' => isset($params['gcs']) ? Str::limit($params['gcs'], 7, '') : null,
            'is_bot' => $reason !== null,
            'bot_reason' => $reason,
            'occurred_at' => now(),
        ]);
    }

    /**
     * The page, as a path, with the query string dropped.
     *
     * A query string on our own URLs carries a page number or a filter, and
     * keeping it would split `/games` into a thousand rows that are the same
     * page. It also carries `utm_*` and `gclid`, which belong to the referrer
     * report and not to the page one.
     */
    private function path(string $url): ?string
    {
        $parts = parse_url($url);

        if ($parts === false || ! isset($parts['path'])) {
            return null;
        }

        $host = $parts['host'] ?? '';

        // A hit whose page is not on our hostname is not ours to count. It
        // happens: a tag left on a staging copy, or somebody's mirror.
        if ($host !== '' && ! str_ends_with($host, 'techplay.gg')) {
            return null;
        }

        return Str::limit($parts['path'], 511, '');
    }

    /** " | TechPlay" on the end of every title is noise in a list of titles. */
    private function cleanTitle(string $title): string
    {
        return trim(preg_replace('/\s*[|·—-]\s*TechPlay\s*$/u', '', $title)) ?: $title;
    }

    /**
     * Where they came from, to the hostname and no further.
     *
     * A full referrer from a search engine can carry the query, and from a
     * social app the post id. Neither is ours, and neither is needed to say
     * "Google sent 400 readers".
     */
    private function referrerHost(?string $referrer): ?string
    {
        if (! $referrer) {
            return null;
        }

        $host = parse_url($referrer, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return null;
        }

        $host = preg_replace('/^www\./', '', strtolower($host));

        // Our own pages linking to each other are navigation, not a source.
        if (str_ends_with($host, 'techplay.gg')) {
            return null;
        }

        return Str::limit($host, 189, '');
    }

    private function country(?string $value): ?string
    {
        return $value && preg_match('/^[A-Za-z]{2}$/', $value) ? strtoupper($value) : null;
    }

    /**
     * Phone, tablet or desktop.
     *
     * `uamb` is the client hint for "mobile", which is the only one GA sends
     * reliably; a tablet reports itself as not-mobile with a wide screen, so
     * the screen decides between the two.
     */
    private function device(array $params): ?string
    {
        $width = $this->screenWidth($params['sr'] ?? null);

        if (($params['uamb'] ?? '') === '1') {
            return 'mobile';
        }

        if ($width === null) {
            return null;
        }

        return $width < 768 ? 'mobile' : ($width < 1180 ? 'tablet' : 'desktop');
    }

    private function screenWidth(?string $screen): ?int
    {
        if (! $screen || ! preg_match('/^(\d{2,5})x\d{2,5}$/', $screen, $m)) {
            return null;
        }

        return min((int) $m[1], 65535);
    }

    /**
     * The browser, by name only.
     *
     * Order matters: Edge and Opera both put "Chrome" in their user agent, and
     * every Chromium browser puts "Safari" there. Checking the specific ones
     * first is the whole trick.
     */
    private function browser(string $ua): ?string
    {
        foreach ([
            'Edg/' => 'Edge',
            'OPR/' => 'Opera',
            'SamsungBrowser' => 'Samsung',
            'YaBrowser' => 'Yandex',
            'Firefox/' => 'Firefox',
            'CriOS' => 'Chrome',
            'Chrome/' => 'Chrome',
            'Safari/' => 'Safari',
        ] as $needle => $name) {
            if (str_contains($ua, $needle)) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Why this hit is not a reader, or null if it is one.
     *
     * Two rules. The first is the user agent saying so. The second is the one
     * measured on 8 September and deliberately not used for blocking: a client
     * claiming to be Chrome while sending no `sec-ch-ua`, which every real
     * Chrome and Edge has sent since 2021. It was rejected as a firewall rule
     * because Googlebot's user agent also contains "Chrome/" and a firewall
     * must never be wrong about Googlebot. Here being right about Googlebot is
     * the point: it is not a reader and should not be counted as one.
     */
    private function botReason(string $ua, bool $hasClientHints): ?string
    {
        $lower = strtolower($ua);

        foreach (self::DECLARED as $needle) {
            if (str_contains($lower, $needle)) {
                return 'declared';
            }
        }

        if ($ua === '') {
            return 'no-user-agent';
        }

        if (str_contains($ua, 'Chrome/') && ! $hasClientHints) {
            return 'chrome-without-hints';
        }

        return null;
    }
}
