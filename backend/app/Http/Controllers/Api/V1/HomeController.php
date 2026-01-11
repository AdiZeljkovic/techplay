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
            // 1. Hero Articles
            $hero = Article::where('is_featured_in_hero', true)
                ->where('status', 'published')
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 2. Latest News (Root type = news)
            $news = Article::whereHas('category', fn($q) => $q->where('type', 'news'))
                ->where('status', 'published')
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 3. Latest Reviews (Root type = reviews)
            $reviews = Article::whereHas('category', fn($q) => $q->where('type', 'reviews'))
                ->where('status', 'published')
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 4. Tech / Hardware Lab (Root type = tech)
            $tech = Article::whereHas('category', fn($q) => $q->where('type', 'tech'))
                ->where('status', 'published')
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 5. Global Latest (Mixed types)
            $latestGlobal = Article::where('status', 'published')
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(5)
                ->get();

            // 6. Global Popular (Mixed types, sorted by views)
            $popularGlobal = Article::where('status', 'published')
                ->with(['author', 'category'])
                ->popular()
                ->take(5)
                ->get();

            return [
                'hero' => $hero,
                'news' => $news,
                'reviews' => $reviews,
                'tech' => $tech,
                'latest_global' => $latestGlobal,
                'popular_global' => $popularGlobal,
            ];
        });

        return $this->success($data);
    }
}

