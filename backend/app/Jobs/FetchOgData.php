<?php

namespace App\Jobs;

use App\Models\EditorialMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

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
        if (!$message) return;

        try {
            $html = $this->fetchUrl($this->url);
            if (!$html) return;

            $ogData = $this->parseOgTags($html);

            if ($ogData['title'] || $ogData['description']) {
                $message->update(['og_data' => $ogData]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::debug('OG fetch failed for: ' . $this->url . ' - ' . $e->getMessage());
        }
    }

    protected function fetchUrl(string $url): ?string
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml',
                'Accept-Language: en-US,en;q=0.9',
            ],
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            CURLOPT_ENCODING => '',
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

        // Extract all meta tags at once for more reliable parsing
        preg_match_all('/<meta\s[^>]*>/is', $html, $metaTags);

        foreach ($metaTags[0] as $tag) {
            // Extract property and content attributes
            $property = null;
            $content = null;

            if (preg_match('/property\s*=\s*["\']([^"\']+)["\']/i', $tag, $m)) {
                $property = $m[1];
            }
            if (preg_match('/content\s*=\s*["\']([^"\']*(?:[^"\'\\\\]|\\\\.)*)["\']/i', $tag, $m)) {
                $content = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
            }

            // Also check name attribute for fallback meta tags
            $name = null;
            if (preg_match('/name\s*=\s*["\']([^"\']+)["\']/i', $tag, $m)) {
                $name = $m[1];
            }

            if ($property && $content !== null) {
                match ($property) {
                    'og:title' => $data['title'] = $data['title'] ?? $content,
                    'og:description' => $data['description'] = $data['description'] ?? $content,
                    'og:image' => $data['image'] = $data['image'] ?? $content,
                    'og:site_name' => $data['site_name'] = $data['site_name'] ?? $content,
                    default => null,
                };
            }

            // Fallback: meta name="description"
            if ($name === 'description' && $content !== null && !$data['description']) {
                $data['description'] = $content;
            }
        }

        // Fallback to <title> tag
        if (!$data['title'] && preg_match('/<title[^>]*>([^<]+)<\/title>/is', $html, $m)) {
            $data['title'] = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
        }

        return $data;
    }
}
