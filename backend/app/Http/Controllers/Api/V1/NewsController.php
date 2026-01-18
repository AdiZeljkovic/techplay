<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $cacheKey = "news.index.page_{$page}.cat_{$category}";

        // Note: Caching for 1 hour (production)
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, \App\Services\CacheService::TTL_LONG, function () use ($request) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'news'
                ->whereHas('category', fn($q) => $q->where('type', 'news'))
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

            return \App\Http\Resources\V1\ArticleResource::collection(
                $query->latest('published_at')->paginate(12)
            );
        })->header('Cache-Control', 'public, max-age=60');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug)
    {
        $cacheKey = "news.show.{$slug}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
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
                    }
                ])
                ->firstOrFail();

            return new \App\Http\Resources\V1\ArticleResource($article);
        })->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Get trending news articles
     */
    public function trending()
    {
        return \Illuminate\Support\Facades\Cache::remember('news.trending', 3600, function () {
            $articles = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->orderBy('views', 'desc')
                ->limit(5)
                ->with(['category', 'author:id,username,avatar_url'])
                ->get();

            return \App\Http\Resources\V1\ArticleResource::collection($articles);
        })->header('Cache-Control', 'public, max-age=300');
    }
}