<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SiteSetting;

class IndexNowService
{
    /**
     * Ping search engines about new/updated content
     */
    public static function ping(string $url): bool
    {
        $key = SiteSetting::get('seo_indexnow_key');

        if (!$key) {
            Log::warning('IndexNow: No key configured');
            return false;
        }

        $host = parse_url(config('app.frontend_url'), PHP_URL_HOST);

        // Ping Bing (which shares with Yandex, Seznam, etc.)
        try {
            $response = Http::get('https://api.indexnow.org/indexnow', [
                'url' => $url,
                'key' => $key,
                'keyLocation' => config('app.url') . "/{$key}.txt",
            ]);

            if ($response->successful() || $response->status() === 202) {
                Log::info("IndexNow: Pinged {$url}");
                return true;
            }

            Log::warning("IndexNow: Failed for {$url}", [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error("IndexNow: Error pinging {$url}", [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Ping multiple URLs at once
     */
    public static function pingBatch(array $urls): int
    {
        $key = SiteSetting::get('seo_indexnow_key');

        if (!$key || empty($urls)) {
            return 0;
        }

        try {
            $response = Http::post('https://api.indexnow.org/indexnow', [
                'host' => parse_url(config('app.frontend_url'), PHP_URL_HOST),
                'key' => $key,
                'keyLocation' => config('app.url') . "/{$key}.txt",
                'urlList' => array_slice($urls, 0, 10000), // Max 10k URLs
            ]);

            if ($response->successful() || $response->status() === 202) {
                Log::info("IndexNow: Batch pinged " . count($urls) . " URLs");
                return count($urls);
            }

            return 0;

        } catch (\Exception $e) {
            Log::error("IndexNow: Batch error", ['error' => $e->getMessage()]);
            return 0;
        }
    }
}
