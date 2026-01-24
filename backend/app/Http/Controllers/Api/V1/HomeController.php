<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Services\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    use \App\Traits\ApiResponse;

    public function index(): JsonResponse
    {
        // Cache home page data for 1 minute (was 5 mins) to improve responsiveness
        $data = Cache::remember('home:data', 60, function () {
            // 1. Hero Articles (exclude scheduled/future posts)
            $hero = Article::where('is_featured_in_hero', true)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 2. Latest News (Root type = news, exclude scheduled/future posts)
            $news = Article::whereHas('category', fn($q) => $q->where('type', 'news'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 3. Latest Reviews (Root type = reviews, exclude scheduled/future posts)
            $reviews = Article::whereHas('category', fn($q) => $q->where('type', 'reviews'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 4. Tech / Hardware Lab (Root type = tech, exclude scheduled/future posts)
            $tech = Article::whereHas('category', fn($q) => $q->where('type', 'tech'))
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 5. Global Latest (Mixed types, exclude scheduled/future posts)
            $latestGlobal = Article::where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
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
                'hero' => \App\Http\Resources\V1\ArticleResource::collection($hero),
                'news' => \App\Http\Resources\V1\ArticleResource::collection($news),
                'reviews' => \App\Http\Resources\V1\ArticleResource::collection($reviews),
                'tech' => \App\Http\Resources\V1\ArticleResource::collection($tech),
                'latest_global' => \App\Http\Resources\V1\ArticleResource::collection($latestGlobal),
                'popular_global' => \App\Http\Resources\V1\ArticleResource::collection($popularGlobal),
            ];
        });

        // PERFORMANCE: Add HTTP cache header for Cloudflare edge caching
        return $this->success($data)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}

