<?php

namespace App\Jobs;

use App\Models\EditorialMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchOgData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 10;

    public function __construct(
        protected int $messageId,
        protected string $url
    ) {}

    public function handle(): void
    {
        $message = EditorialMessage::find($this->messageId);
        if (! $message) {
            return;
        }

        try {
            $html = $this->fetchUrl($this->url);
            if (! $html) {
                return;
            }

            $ogData = $this->parseOgTags($html);

            // Fallback: try JSON-LD schema if OG tags missing
            if (! $ogData['title']) {
                $ogData = $this->mergeJsonLd($html, $ogData);
            }

            if ($ogData['title'] || $ogData['description']) {
                $message->update(['og_data' => $ogData]);
            }
        } catch (\Exception $e) {
            Log::debug('OG fetch failed for: '.$this->url.' - '.$e->getMessage());
        }
    }

    protected function fetchUrl(string $url): ?string
    {
        // Only what a link preview needs to reach. Set apart from the array
        // below because the string form of these two arrived in libcurl 7.85 —
        // referencing an undefined constant is a fatal, and this runs on a
        // server whose libcurl this file cannot check.
        $protocolLimits = [];

        if (defined('CURLOPT_PROTOCOLS_STR')) {
            $protocolLimits[CURLOPT_PROTOCOLS_STR] = 'http,https';
            $protocolLimits[CURLOPT_REDIR_PROTOCOLS_STR] = 'http,https';
        } elseif (defined('CURLPROTO_HTTP')) {
            $protocolLimits[CURLOPT_PROTOCOLS] = CURLPROTO_HTTP | CURLPROTO_HTTPS;
            $protocolLimits[CURLOPT_REDIR_PROTOCOLS] = CURLPROTO_HTTP | CURLPROTO_HTTPS;
        }

        $ch = curl_init();
        curl_setopt_array($ch, $protocolLimits + [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
            // Verified. This was off, which meant every link preview the
            // newsroom pasted was fetched over a connection nobody checked —
            // and the answer is parsed and stored. Turning it off buys nothing
            // here: a site with a broken certificate simply gets no preview.
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: hr,en-US;q=0.9,en;q=0.8',
                'Cache-Control: no-cache',
                'Pragma: no-cache',
                'Sec-Fetch-Dest: document',
                'Sec-Fetch-Mode: navigate',
                'Sec-Fetch-Site: none',
                'Sec-Fetch-User: ?1',
                'Upgrade-Insecure-Requests: 1',
            ],
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            CURLOPT_REFERER => 'https://www.google.com/',
            CURLOPT_ENCODING => '',
            CURLOPT_COOKIEFILE => '',
        ]);

        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($html === false || $httpCode >= 400) {
            return null;
        }

        return $html;
    }

    protected function parseOgTags(string $html): array
    {
        $data = [
            'url' => $this->url,
            'title' => null,
            'description' => null,
            'image' => null,
            'site_name' => null,
        ];

        // Extract all meta tags at once
        preg_match_all('/<meta\s[^>]*>/is', $html, $metaTags);

        foreach ($metaTags[0] as $tag) {
            $property = null;
            $content = null;
            $name = null;

            if (preg_match('/property\s*=\s*["\']([^"\']+)["\']/i', $tag, $m)) {
                $property = $m[1];
            }
            if (preg_match('/content\s*=\s*["\'](.+?)["\']/is', $tag, $m)) {
                $content = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
            }
            if (preg_match('/name\s*=\s*["\']([^"\']+)["\']/i', $tag, $m)) {
                $name = strtolower($m[1]);
            }

            if ($property && $content) {
                match ($property) {
                    'og:title' => $data['title'] = $data['title'] ?? $content,
                    'og:description' => $data['description'] = $data['description'] ?? $content,
                    'og:image' => $data['image'] = $data['image'] ?? $content,
                    'og:site_name' => $data['site_name'] = $data['site_name'] ?? $content,
                    default => null,
                };
            }

            // Twitter card fallbacks
            if ($name === 'twitter:title' && $content && ! $data['title']) {
                $data['title'] = $content;
            }
            if ($name === 'twitter:description' && $content && ! $data['description']) {
                $data['description'] = $content;
            }
            if ($name === 'twitter:image' && $content && ! $data['image']) {
                $data['image'] = $content;
            }

            // Standard meta fallbacks
            if ($name === 'description' && $content && ! $data['description']) {
                $data['description'] = $content;
            }
            if ($name === 'title' && $content && ! $data['title']) {
                $data['title'] = $content;
            }
        }

        // Fallback to <title> tag
        if (! $data['title'] && preg_match('/<title[^>]*>([^<]+)<\/title>/is', $html, $m)) {
            $data['title'] = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
        }

        return $data;
    }

    protected function mergeJsonLd(string $html, array $data): array
    {
        // Find JSON-LD script blocks
        preg_match_all('/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $matches);

        foreach ($matches[1] as $json) {
            $ld = json_decode(trim($json), true);
            if (! $ld) {
                continue;
            }

            // Handle @graph wrapper
            $items = isset($ld['@graph']) ? $ld['@graph'] : [$ld];

            foreach ($items as $item) {
                $type = $item['@type'] ?? '';
                if (! in_array($type, ['Article', 'NewsArticle', 'BlogPosting', 'WebPage', 'Product', 'VideoObject'])) {
                    continue;
                }

                if (! $data['title'] && ! empty($item['headline'])) {
                    $data['title'] = $item['headline'];
                }
                if (! $data['title'] && ! empty($item['name'])) {
                    $data['title'] = $item['name'];
                }
                if (! $data['description'] && ! empty($item['description'])) {
                    $data['description'] = $item['description'];
                }
                if (! $data['image']) {
                    $img = $item['image'] ?? $item['thumbnailUrl'] ?? null;
                    if (is_array($img)) {
                        $data['image'] = $img['url'] ?? $img[0] ?? null;
                    } elseif (is_string($img)) {
                        $data['image'] = $img;
                    }
                }
                if (! $data['site_name'] && ! empty($item['publisher']['name'])) {
                    $data['site_name'] = $item['publisher']['name'];
                }

                // Found a match, stop
                if ($data['title']) {
                    break 2;
                }
            }
        }

        return $data;
    }
}
