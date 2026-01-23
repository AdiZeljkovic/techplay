<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CacheRevalidationService
 *
 * Triggers Next.js on-demand revalidation when content changes.
 * This allows instant content updates for users while maintaining ISR performance benefits.
 *
 * Flow:
 * 1. Article is published/updated in Laravel
 * 2. ArticleObserver calls this service
 * 3. Service POSTs to Next.js /api/revalidate endpoint
 * 4. Next.js invalidates cached pages
 * 5. Next request fetches fresh data from Laravel
 */
class CacheRevalidationService
{
    /**
     * Trigger Next.js revalidation for article changes
     *
     * @param string $type - news, review, tech, guide, video
     * @param string $slug - article slug
     * @param array $additionalPaths - additional paths to revalidate
     * @return bool
     */
    public static function revalidateArticle(string $type, string $slug, array $additionalPaths = []): bool
    {
        $frontendUrl = config('app.frontend_url');
        $revalidationSecret = config('app.revalidation_secret');

        if (!$frontendUrl || !$revalidationSecret) {
            Log::warning('[Revalidation] Missing configuration', [
                'frontend_url' => $frontendUrl,
                'has_secret' => !empty($revalidationSecret)
            ]);
            return false;
        }

        $endpoint = rtrim($frontendUrl, '/') . '/api/revalidate';

        $payload = [
            'type' => $type,
            'slug' => $slug,
            'paths' => $additionalPaths,
            'timestamp' => now()->toIso8601String()
        ];

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => "Bearer {$revalidationSecret}",
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, $payload);

            if ($response->successful()) {
                Log::info('[Revalidation] Success', [
                    'type' => $type,
                    'slug' => $slug,
                    'status' => $response->status()
                ]);
                return true;
            } else {
                Log::warning('[Revalidation] Failed', [
                    'type' => $type,
                    'slug' => $slug,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('[Revalidation] Exception', [
                'type' => $type,
                'slug' => $slug,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Revalidate home page
     */
    public static function revalidateHome(): bool
    {
        return self::revalidateByType('home');
    }

    /**
     * Revalidate navigation tree (when categories change)
     */
    public static function revalidateNavigation(): bool
    {
        return self::revalidateByType('category');
    }

    /**
     * Revalidate by type (generic)
     */
    private static function revalidateByType(string $type, array $paths = []): bool
    {
        $frontendUrl = config('app.frontend_url');
        $revalidationSecret = config('app.revalidation_secret');

        if (!$frontendUrl || !$revalidationSecret) {
            return false;
        }

        $endpoint = rtrim($frontendUrl, '/') . '/api/revalidate';

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => "Bearer {$revalidationSecret}",
                ])
                ->post($endpoint, [
                    'type' => $type,
                    'paths' => $paths,
                    'timestamp' => now()->toIso8601String()
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('[Revalidation] Exception', [
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Revalidate multiple paths at once
     */
    public static function revalidatePaths(array $paths): bool
    {
        $frontendUrl = config('app.frontend_url');
        $revalidationSecret = config('app.revalidation_secret');

        if (!$frontendUrl || !$revalidationSecret || empty($paths)) {
            return false;
        }

        $endpoint = rtrim($frontendUrl, '/') . '/api/revalidate';

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => "Bearer {$revalidationSecret}",
                ])
                ->post($endpoint, [
                    'paths' => $paths,
                    'timestamp' => now()->toIso8601String()
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('[Revalidation] Paths exception', [
                'paths' => $paths,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
