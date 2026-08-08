<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class TechController extends Controller
{
    /**
     * Display a listing of tech articles.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $cacheKey = "tech.index.v3.page_{$page}.cat_{$category}";

        $resource = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($request) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'tech'
                ->whereHas('category', fn ($q) => $q->where('type', 'tech'))
                ->with(['author:id,username,display_name,avatar_url', 'category']);

            if ($request->has('category') && $request->category !== 'all') {
                $categorySlug = $request->category;
                $query->whereHas('category', function ($q) use ($categorySlug) {
                    $q->where('slug', $categorySlug);
                    if (is_numeric($categorySlug)) {
                        $q->orWhere('id', $categorySlug);
                    }
                });
            }

            return ArticleResource::collection(
                $query->latest('published_at')->paginate(13)
            );
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Display the specified tech article.
     */
    public function show(string $slug)
    {
        // Buffered through Redis and settled by FlushViewCounters every five
        // minutes. This used to be a direct UPDATE on every request — including
        // cache hits — which serialises the whole route on one row lock the
        // moment a story goes viral.
        try {
            $viewId = Article::where('slug', $slug)->value('id');
            if ($viewId) {
                Redis::incr('views:article:'.$viewId);
            }
        } catch (\Throwable) {
            // A counter must never take the page down.
        }

        $cacheKey = "tech.show.v2.{$slug}";

        $resource = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                ->whereHas('category', fn ($q) => $q->where('type', 'tech'))
                // Added display_name
                ->with(['author:id,username,display_name,avatar_url,bio', 'category'])
                ->firstOrFail();

            return new ArticleResource($article);
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=3600');
    }
}
