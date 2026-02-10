<?php

namespace App\Jobs;

use App\Models\EditorialMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

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
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'TechPlayBot/1.0'])
                ->get($this->url);

            if (!$response->successful()) return;

            $html = $response->body();
            $ogData = $this->parseOgTags($html);

            if ($ogData['title'] || $ogData['description']) {
                $message->update(['og_data' => $ogData]);
            }
        } catch (\Exception $e) {
            // Silently fail - OG preview is non-critical
        }
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

        // Parse og:tags
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
            $data['title'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\']/', $html, $m)) {
            $data['title'] = $data['title'] ?? html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        if (preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
            $data['description'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:description["\']/', $html, $m)) {
            $data['description'] = $data['description'] ?? html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
            $data['image'] = $m[1];
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $m)) {
            $data['image'] = $data['image'] ?? $m[1];
        }

        if (preg_match('/<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
            $data['site_name'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:site_name["\']/', $html, $m)) {
            $data['site_name'] = $data['site_name'] ?? html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        // Fallback to <title> tag
        if (!$data['title'] && preg_match('/<title>([^<]+)<\/title>/', $html, $m)) {
            $data['title'] = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
        }

        // Fallback to meta description
        if (!$data['description'] && preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
            $data['description'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }

        return $data;
    }
}
