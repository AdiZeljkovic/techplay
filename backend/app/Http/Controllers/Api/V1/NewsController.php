<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
        // Increment views directly on DB to bypass cache and ensure accuracy
        Article::where('slug', $slug)->increment('views');

        $cacheKey = "news.show.v2.{$slug}";

        $resource = Cache::remember($cacheKey, 3600, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                // IMPORTANT: Only show articles with category type 'news'
                ->whereHas('category', fn ($q) => $q->where('type', 'news'))
                ->with([
                    'author',
                    'category',
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

    /**
     * Get trending news articles
     */
    public function trending()
    {
        $resource = Cache::remember('news.trending', 3600, function () {
            $articles = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->orderBy('views', 'desc')
                ->limit(5)
                ->with(['category', 'author:id,username,avatar_url'])
                ->get();

            return ArticleResource::collection($articles);
        });

        return $resource->response()->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }
}
