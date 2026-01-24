<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    use \App\Traits\ApiResponse;

    public function recordView(Request $request, $slug)
    {
        try {
            $article = Article::where('slug', $slug)->first();

            if (!$article) {
                $article = \App\Models\Guide::where('slug', $slug)->first();
            }

            if (!$article) {
                $article = \App\Models\Review::where('slug', $slug)->firstOrFail();
            }

            // SECURITY: Multiple identifiers for robust throttling
            $ip = $request->ip();
            $userAgent = $request->userAgent() ?? 'unknown';

            // Create fingerprint: IP + partial user agent (browser family)
            // This prevents counting same user multiple times even if cache fails
            $fingerprint = md5($ip . substr($userAgent, 0, 50));

            $incremented = $article->incrementViews($ip, $fingerprint);

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
                'views' => $article->views ?? 0,
                'throttled' => !$incremented
            ]);
        } catch (\Exception $e) {
            Log::error('View tracking error', [
                'slug' => $slug,
                'error' => $e->getMessage()
            ]);

            // Return success anyway to not break frontend
            return $this->success([
                'message' => 'View tracking unavailable',
                'views' => 0,
                'throttled' => true
            ]);
        }
    }
}
