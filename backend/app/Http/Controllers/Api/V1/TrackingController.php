<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    use \App\Traits\ApiResponse;

    public function recordView(Request $request, $slug)
    {
        $article = Article::where('slug', $slug)->first();

        if (!$article) {
            $article = \App\Models\Guide::where('slug', $slug)->firstOrFail();
        }

        // Use IP from request
        $ip = $request->ip();

        $incremented = $article->incrementViews($ip);

        if ($incremented) {
            // Clear the article's show cache so next page load gets fresh views
            \Illuminate\Support\Facades\Cache::forget("news.show.v2.{$slug}");
            \Illuminate\Support\Facades\Cache::forget("reviews.show.v2.{$slug}");
            \Illuminate\Support\Facades\Cache::forget("tech.show.v2.{$slug}");
            \Illuminate\Support\Facades\Cache::forget("guide.show.v2.{$slug}");
        }

        // Always fetch fresh view count from DB
        $article->refresh();

        return $this->success([
            'message' => $incremented ? 'View counted' : 'View throttled',
            'views' => $article->views ?? 0
        ]);
    }
}
