<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article; // Reverted to Article
use App\Http\Resources\V1\ReviewResource; // Use correct resource

class ReviewController extends Controller
{
    /**
     * Display a listing of reviews.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $cacheKey = "reviews.index.page_{$page}.cat_{$category}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, \App\Services\CacheService::TTL_LONG, function () use ($request) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'reviews'
                ->whereHas('category', fn($q) => $q->where('type', 'reviews'))
                ->with(['author:id,username,avatar_url', 'category']);

            if ($request->has('category') && $request->category !== 'all') {
                $categorySlug = $request->category;
                $query->whereHas('category', function ($q) use ($categorySlug) {
                    $q->where('slug', $categorySlug);
                    if (is_numeric($categorySlug)) {
                        $q->orWhere('id', $categorySlug);
                    }
                });
            }

            return ReviewResource::collection(
                $query->latest('published_at')->paginate(12)
            );
        });
    }

    public function show($slug)
    {
        $cacheKey = "reviews.show.{$slug}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, \App\Services\CacheService::TTL_LONG, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                ->with(['author:id,username,avatar_url,bio', 'category'])
                ->firstOrFail();

            return new ReviewResource($article);
        });
    }
}
