<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Guide;
use App\Models\Review;
use App\Services\FunnelAnalytics;
use App\Services\RevalidationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    use ApiResponse;

    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * POST /track/event — first-party funnel counter (auth-only, whitelisted
     * event names, aggregate daily counts in Redis; no per-user data stored).
     */
    public function recordEvent(Request $request)
    {
        $validated = $request->validate([
            'event' => 'required|string|max:40',
        ]);

        if (! in_array($validated['event'], FunnelAnalytics::CLIENT_EVENTS, true)) {
            return $this->error('Unknown event', 422);
        }

        FunnelAnalytics::increment($validated['event']);

        return $this->success(['recorded' => true]);
    }

    /**
     * Determine category path for revalidation based on model type
     *
     * @param  Article|Review|Guide  $article
     */
    protected function getCategoryPath($article): ?string
    {
        if ($article instanceof Review) {
            return 'reviews';
        }

        if ($article instanceof Guide) {
            return 'guides';
        }

        if ($article instanceof Article) {
            // Load category if not already loaded
            if (! $article->relationLoaded('category')) {
                $article->load('category');
            }

            if (! $article->category) {
                return null;
            }

            // Map category type to path
            return match ($article->category->type) {
                'news' => 'news',
                'tech' => 'tech',
                default => null,
            };
        }

        return null;
    }
}
