<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article; // Reverted to Article
use App\Http\Resources\V1\ReviewResource; // Use correct resource

class ReviewController extends Controller
{
    // ... index method unchanged ...

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
