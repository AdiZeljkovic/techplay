<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        // Cache home page data for 5 minutes - balance between freshness and performance
        // On-demand revalidation clears this cache when articles are published
        $data = Cache::flexible('home:data', [300, 1800], function () {
            // 1. Hero Articles (exclude scheduled/future posts)
            $hero = Article::where('is_featured_in_hero', true)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 2. Latest News (Root type = news, exclude scheduled/future posts)
            $news = Article::whereHas('category', fn ($q) => $q->where('type', 'news'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(6)
                ->get();

            // 3. Latest Reviews (Root type = reviews, exclude scheduled/future posts)
            $reviews = Article::whereHas('category', fn ($q) => $q->where('type', 'reviews'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(8)
                ->get();

            // 4. Tech / Hardware Lab (Root type = tech, exclude scheduled/future posts)
            $tech = Article::whereHas('category', fn ($q) => $q->where('type', 'tech'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(6)
                ->get();

            // 5. Global Latest (Mixed types, exclude scheduled/future posts)
            $latestGlobal = Article::where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(10)
                ->get();

            // 6. Global Popular (Mixed types, sorted by views, exclude scheduled/future posts)
            $popularGlobal = Article::where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->popular()
                ->take(5)
                ->get();

            // Wrap in Resource to exclude heavy content and standardise format
            return [
                'hero' => ArticleResource::collection($hero),
                'news' => ArticleResource::collection($news),
                'reviews' => ArticleResource::collection($reviews),
                'tech' => ArticleResource::collection($tech),
                'latest_global' => ArticleResource::collection($latestGlobal),
                'popular_global' => ArticleResource::collection($popularGlobal),
            ];
        });

        // PERFORMANCE: Cache for 5 mins with stale-while-revalidate for better UX
        return $this->success($data)
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }
}
