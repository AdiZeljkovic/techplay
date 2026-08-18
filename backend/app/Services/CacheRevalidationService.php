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
     * @param  string  $type  - news, review, tech, guide, video
     * @param  string  $slug  - article slug
     * @param  array  $additionalPaths  - additional paths to revalidate
     */
    /**
     * Not the method the observers use.
     *
     * `RevalidationService::revalidateArticle(string $slug, string $category)`
     * is what every article path actually calls, and it sends the `category`
     * the Next endpoint requires. This one takes a `$type` first, sends no
     * `category` at all, and would be answered with
     * `{"error":"Missing \"slug\" or \"category\" for article revalidation"}`.
     *
     * Nothing calls it. Left in place rather than deleted because the two
     * services are easy to confuse — this comment is worth more than the
     * removal, since the next person to reach for it is reaching for the
     * wrong class.
     */
    public static function revalidateArticle(string $type, string $slug, array $additionalPaths = []): bool
    {
        $frontendUrl = config('app.frontend_url');
        $revalidationSecret = config('app.revalidation_secret');

        if (! $frontendUrl || ! $revalidationSecret) {
            Log::warning('[Revalidation] Missing configuration', [
                'frontend_url' => $frontendUrl,
                'has_secret' => ! empty($revalidationSecret),
            ]);

            return false;
        }

        $endpoint = rtrim($frontendUrl, '/').'/api/revalidate';

        $payload = [
            'type' => $type,
            'slug' => $slug,
            'paths' => $additionalPaths,
            'timestamp' => now()->toIso8601String(),
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
                    'status' => $response->status(),
                ]);

                return true;
            } else {
                Log::warning('[Revalidation] Failed', [
                    'type' => $type,
                    'slug' => $slug,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }
        } catch (\Exception $e) {
            Log::error('[Revalidation] Exception', [
                'type' => $type,
                'slug' => $slug,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Revalidate a game detail page. The game page is force-dynamic in Next,
     * so the frontend handler also purges the Cloudflare edge cache for it.
     */
    public static function revalidateGame(string $slug): bool
    {
        $frontendUrl = config('app.frontend_url');
        $revalidationSecret = config('app.revalidation_secret');

        if (! $frontendUrl || ! $revalidationSecret) {
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders(['Authorization' => "Bearer {$revalidationSecret}"])
                ->post(rtrim($frontendUrl, '/').'/api/revalidate', [
                    'type' => 'game',
                    'slug' => $slug,
                    'timestamp' => now()->toIso8601String(),
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('[Revalidation] Game exception', [
                'slug' => $slug,
                'error' => $e->getMessage(),
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

        if (! $frontendUrl || ! $revalidationSecret) {
            return false;
        }

        $endpoint = rtrim($frontendUrl, '/').'/api/revalidate';

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => "Bearer {$revalidationSecret}",
                ])
                ->post($endpoint, [
                    'type' => $type,
                    'paths' => $paths,
                    'timestamp' => now()->toIso8601String(),
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('[Revalidation] Exception', [
                'type' => $type,
                'error' => $e->getMessage(),
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

        if (! $frontendUrl || ! $revalidationSecret || empty($paths)) {
            return false;
        }

        $endpoint = rtrim($frontendUrl, '/').'/api/revalidate';

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Authorization' => "Bearer {$revalidationSecret}",
                ])
                ->post($endpoint, [
                    'paths' => $paths,
                    'timestamp' => now()->toIso8601String(),
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('[Revalidation] Paths exception', [
                'paths' => $paths,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
