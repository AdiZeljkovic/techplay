<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ReviewResource; // Reverted to Article
use App\Models\Article; // Use correct resource
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReviewController extends Controller
{
    /**
     * Display a listing of reviews.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $cacheKey = "reviews.index.v2.page_{$page}.cat_{$category}";

        $resource = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($request) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'reviews'
                ->whereHas('category', fn ($q) => $q->where('type', 'reviews'))
                ->with(['author:id,username,display_name,avatar_url', 'category']);

            // Handle category filtering
            if ($request->has('category') && $request->category !== 'all') {
                $categorySlug = $request->category;

                // 'reviews-latest' shows all reviews from all review categories (no extra filter)
                // The base query already filters by category type 'reviews'
                if ($categorySlug !== 'reviews-latest') {
                    $query->whereHas('category', function ($q) use ($categorySlug) {
                        $q->where('slug', $categorySlug);
                        if (is_numeric($categorySlug)) {
                            $q->orWhere('id', $categorySlug);
                        }
                    });
                }
            }

            return ReviewResource::collection(
                $query->latest('published_at')->paginate(12)
            );
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=3600');
    }

    public function show($slug)
    {
        // Increment views directly on DB to bypass cache and ensure accuracy
        Article::where('slug', $slug)->increment('views');

        $cacheKey = "reviews.show.v2.{$slug}";

        $resource = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                // IMPORTANT: Only show articles with category type 'reviews'
                ->whereHas('category', fn ($q) => $q->where('type', 'reviews'))
                ->with(['author:id,username,display_name,avatar_url,bio', 'category'])
                ->firstOrFail();

            return new ReviewResource($article);
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=3600');
    }
}
