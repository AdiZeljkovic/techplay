<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class NewsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $search = $request->get('search', '');
        $cacheKey = "news.index.v3.page_{$page}.cat_{$category}.search_".md5($search);

        // Note: Caching for 1 hour (production)
        $resource = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($request, $search) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'news'
                ->whereHas('category', fn ($q) => $q->where('type', 'news'))
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

            if (! empty($search)) {
                $query->where('title', 'ILIKE', "%{$search}%");
            }

            return ArticleResource::collection(
                $query->latest('published_at')->paginate(13)
            );
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    /**
     * Display the specified resource.
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

        $cacheKey = "news.show.v3.{$slug}";

        $resource = Cache::remember($cacheKey, 3600, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                // IMPORTANT: Only show articles with category type 'news'
                ->whereHas('category', fn ($q) => $q->where('type', 'news'))
                ->with([
                    'author',
                    'category',
                    'game:id,slug,name,cover_url,released,rating,genres,platforms,critic_scores',
                    'comments' => function ($query) {
                        $query->where('status', 'approved')
                            ->whereNull('parent_id')
                            ->orderBy('created_at', 'desc')
                            // Limit to 20 for initial load performance
                            ->limit(20)
                            ->with(['user.rank', 'replies.user.rank']);
                    },
                ])
                ->firstOrFail();

            return new ArticleResource($article);
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }
}
