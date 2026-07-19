<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Guide;
use App\Models\Review;
use App\Services\FunnelAnalytics;
use App\Services\RevalidationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    use ApiResponse;

    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * POST /track/event — first-party funnel counter (auth-only, whitelisted
     * event names, aggregate daily counts in Redis; no per-user data stored).
     */
    public function recordEvent(Request $request)
    {
        $validated = $request->validate([
            'event' => 'required|string|max:40',
        ]);

        if (! in_array($validated['event'], FunnelAnalytics::CLIENT_EVENTS, true)) {
            return $this->error('Unknown event', 422);
        }

        FunnelAnalytics::increment($validated['event']);

        return $this->success(['recorded' => true]);
    }

    /**
     * Get current view count without incrementing
     * Fast, cache-friendly endpoint for real-time view display
     */
    public function getViews($slug)
    {
        try {
            $article = Article::where('slug', $slug)->first();

            if (! $article) {
                $article = Guide::where('slug', $slug)->first();
            }

            if (! $article) {
                $article = Review::where('slug', $slug)->first();
            }

            if (! $article) {
                return $this->error('Article not found', 404);
            }

            return $this->success([
                'views' => $article->views ?? 0,
            ]);
        } catch (\Exception $e) {
            return $this->success(['views' => 0]);
        }
    }

    public function recordView(Request $request, $slug)
    {
        try {
            $article = Article::where('slug', $slug)->first();

            if (! $article) {
                $article = Guide::where('slug', $slug)->first();
            }

            if (! $article) {
                $article = Review::where('slug', $slug)->firstOrFail();
            }

            // SECURITY: Multiple identifiers for robust throttling
            $ip = $request->ip();
            $userAgent = $request->userAgent() ?? 'unknown';

            // Create fingerprint: IP + partial user agent (browser family)
            // This prevents counting same user multiple times even if cache fails
            $fingerprint = md5($ip.substr($userAgent, 0, 50));

            $incremented = $article->incrementViews($ip, $fingerprint);

            if ($incremented) {
                // Clear the article's show cache so next page load gets fresh views
                Cache::forget("news.show.v2.{$slug}");
                Cache::forget("reviews.show.v2.{$slug}");
                Cache::forget("tech.show.v2.{$slug}");
                Cache::forget("guide.show.v2.{$slug}");

                // Trigger Next.js ISR revalidation for updated view count
                $categoryPath = $this->getCategoryPath($article);
                if ($categoryPath) {
                    $this->revalidationService->revalidateArticle($slug, $categoryPath);
                }
            }

            // Always fetch fresh view count from DB
            $article->refresh();

            return $this->success([
                'message' => $incremented ? 'View counted' : 'View throttled',
                'views' => $article->views ?? 0,
                'throttled' => ! $incremented,
            ]);
        } catch (\Exception $e) {
            Log::error('View tracking error', [
                'slug' => $slug,
                'error' => $e->getMessage(),
            ]);

            // Return success anyway to not break frontend
            return $this->success([
                'message' => 'View tracking unavailable',
                'views' => 0,
                'throttled' => true,
            ]);
        }
    }

    /**
     * Determine category path for revalidation based on model type
     *
     * @param  Article|Review|Guide  $article
     */
    protected function getCategoryPath($article): ?string
    {
        if ($article instanceof Review) {
            return 'reviews';
        }

        if ($article instanceof Guide) {
            return 'guides';
        }

        if ($article instanceof Article) {
            // Load category if not already loaded
            if (! $article->relationLoaded('category')) {
                $article->load('category');
            }

            if (! $article->category) {
                return null;
            }

            // Map category type to path
            return match ($article->category->type) {
                'news' => 'news',
                'tech' => 'tech',
                default => null,
            };
        }

        return null;
    }
}
