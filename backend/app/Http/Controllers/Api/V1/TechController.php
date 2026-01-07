<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Http\Resources\V1\ArticleResource;
use Illuminate\Http\Request;

class TechController extends Controller
{
    /**
     * Display a listing of tech articles.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $category = $request->get('category', 'all');
        $cacheKey = "tech.index.page_{$page}.cat_{$category}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, \App\Services\CacheService::TTL_LONG, function () use ($request) {
            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // IMPORTANT: Only show articles with category type 'tech'
                ->whereHas('category', fn($q) => $q->where('type', 'tech'))
                ->with(['author:id,username,avatar_url', 'category']);

            if ($request->has('category') && $request->category !== 'all') {
                $categorySlug = $request->category;
                $query->whereHas('category', function ($q) use ($categorySlug) {
                    $q->where('slug', $categorySlug)
                        ->orWhere('id', $categorySlug);
                });
            }

            return ArticleResource::collection(
                $query->latest('published_at')->paginate(12)
            );
        });
    }

    /**
     * Display the specified tech article.
     */
    public function show(string $slug)
    {
        $cacheKey = "tech.show.{$slug}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, \App\Services\CacheService::TTL_LONG, function () use ($slug) {
            $article = Article::where('slug', $slug)
                ->where('status', 'published')
                ->whereHas('category', fn($q) => $q->where('type', 'tech'))
                ->with(['author:id,username,avatar_url,bio', 'category'])
                ->firstOrFail();

            return new ArticleResource($article);
        });
    }
}
