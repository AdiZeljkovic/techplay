<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Services\RevalidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    use \App\Traits\ApiResponse;

    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * Get current view count without incrementing
     * Fast, cache-friendly endpoint for real-time view display
     */
    public function getViews($slug)
    {
        try {
            $article = Article::where('slug', $slug)->first();

            if (!$article) {
                $article = \App\Models\Guide::where('slug', $slug)->first();
            }

            if (!$article) {
                $article = \App\Models\Review::where('slug', $slug)->first();
            }

            if (!$article) {
                return $this->error('Article not found', 404);
            }

            return $this->success([
                'views' => $article->views ?? 0
            ]);
        } catch (\Exception $e) {
            return $this->success(['views' => 0]);
        }
    }

    public function recordView(Request $request, $slug)
    {
        try {
            $article = Article::where('slug', $slug)->first();

            if (!$article) {
                $article = \App\Models\Guide::where('slug', $slug)->first();
            }

            if (!$article) {
                $article = \App\Models\Review::where('slug', $slug)->firstOrFail();
            }

            // SECURITY: Multiple identifiers for robust throttling
            $ip = $request->ip();
            $userAgent = $request->userAgent() ?? 'unknown';

            // Create fingerprint: IP + partial user agent (browser family)
            // This prevents counting same user multiple times even if cache fails
            $fingerprint = md5($ip . substr($userAgent, 0, 50));

            $incremented = $article->incrementViews($ip, $fingerprint);

            if ($incremented) {
                // Clear the article's show cache so next page load gets fresh views
                \Illuminate\Support\Facades\Cache::forget("news.show.v2.{$slug}");
                \Illuminate\Support\Facades\Cache::forget("reviews.show.v2.{$slug}");
                \Illuminate\Support\Facades\Cache::forget("tech.show.v2.{$slug}");
                \Illuminate\Support\Facades\Cache::forget("guide.show.v2.{$slug}");

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
                'throttled' => !$incremented
            ]);
        } catch (\Exception $e) {
            Log::error('View tracking error', [
                'slug' => $slug,
                'error' => $e->getMessage()
            ]);

            // Return success anyway to not break frontend
            return $this->success([
                'message' => 'View tracking unavailable',
                'views' => 0,
                'throttled' => true
            ]);
        }
    }

    /**
     * Determine category path for revalidation based on model type
     *
     * @param \App\Models\Article|\App\Models\Review|\App\Models\Guide $article
     * @return string|null
     */
    protected function getCategoryPath($article): ?string
    {
        if ($article instanceof \App\Models\Review) {
            return 'reviews';
        }

        if ($article instanceof \App\Models\Guide) {
            return 'guides';
        }

        if ($article instanceof Article) {
            // Load category if not already loaded
            if (!$article->relationLoaded('category')) {
                $article->load('category');
            }

            if (!$article->category) {
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
