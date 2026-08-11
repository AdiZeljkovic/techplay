<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Guide;
use App\Models\GuideVote;
use App\Services\CacheService;
use App\Services\ContentGameLinker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class GuideController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $difficulty = $request->get('difficulty', 'all');
        $search = $request->get('search', '');
        $cacheKey = "guides.index.v3.page_{$page}.diff_{$difficulty}.search_".md5($search);

        $resource = Cache::remember($cacheKey, CacheService::TTL_MEDIUM, function () use ($request, $search) {
            // Named columns, not the whole row. The listing was paginating
            // full Guide models, so every card carried the guide's entire body
            // plus its SEO block — 67 KB for thirteen cards that show a title,
            // an image, an excerpt and a difficulty.
            $query = Guide::query()
                ->select([
                    'id', 'author_id', 'game_id', 'title', 'slug', 'excerpt',
                    'featured_image_url', 'difficulty', 'status', 'views',
                    'published_at', 'created_at',
                ])
                ->with('author:id,username,display_name,avatar_url');

            if ($request->has('difficulty') && $request->difficulty !== 'all') {
                $query->where('difficulty', $request->difficulty);
            }

            // Search support
            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'ILIKE', "%{$search}%")
                        ->orWhere('excerpt', 'ILIKE', "%{$search}%")
                        ->orWhere('content', 'ILIKE', "%{$search}%");
                });
            }

            return $query->latest()->paginate(13);
        });

        return response()->json($resource)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function show($slug)
    {
        // Buffered through Redis and settled by FlushViewCounters every five
        // minutes. This used to be a direct UPDATE on every request — including
        // cache hits — which serialises the whole route on one row lock the
        // moment a story goes viral.
        try {
            $viewId = Guide::where('slug', $slug)->value('id');
            if ($viewId) {
                Redis::incr('views:guide:'.$viewId);
            }
        } catch (\Throwable) {
            // A counter must never take the page down.
        }

        // Cache the Guide data itself
        $guide = Cache::remember("guide.show.v3.{$slug}", CacheService::TTL_LONG, function () use ($slug) {
            return Guide::where('slug', $slug)
                ->with(['author:id,username,display_name,avatar_url,bio', 'game:id,slug,name,cover_url,released,rating,genres,platforms,critic_scores'])
                ->withCount([
                    'votes as helpful_count' => function ($query) {
                        $query->where('is_helpful', true);
                    },
                ])
                ->firstOrFail();
        });

        // Check user vote (do not cache this or cache per user)
        $userVote = null;
        if (Auth::guard('sanctum')->check()) {
            $vote = GuideVote::where('guide_id', $guide->id)
                ->where('user_id', Auth::guard('sanctum')->id())
                ->first();
            $userVote = $vote ? $vote->is_helpful : null;
        }

        return response()->json([
            'guide' => $guide,
            'game' => ContentGameLinker::gamePayload($guide->game),
            'user_vote' => $userVote,
        ], 200, ['Cache-Control' => 'no-cache, no-store, must-revalidate']);
    }

    public function vote(Request $request, $slug)
    {
        $request->validate([
            'is_helpful' => 'required|boolean',
        ]);

        $guide = Guide::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        $vote = GuideVote::updateOrCreate(
            ['guide_id' => $guide->id, 'user_id' => $user->id],
            ['is_helpful' => $request->is_helpful]
        );

        return response()->json(['message' => 'Vote recorded.', 'vote' => $vote]);
    }
}
