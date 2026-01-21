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
            $article->refresh(); // Reload from DB to get updated view count
            return $this->success(['message' => 'View counted', 'views' => $article->views]);
        }

        return $this->success(['message' => 'View throttled', 'views' => $article->views]);
    }
}
