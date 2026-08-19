<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Guide;
use App\Models\GuideVote;
use App\Services\CacheService;
use App\Services\ContentGameLinker;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class GuideController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $difficulty = $request->input('difficulty', 'all');
        $search = $request->input('search', '');
        $cacheKey = "guides.index.v3.page_{$page}.diff_{$difficulty}.search_".md5($search);
        // Recorded so the observer can clear this exact variant; a listing
        // key carries page, category and search, and cannot be guessed.
        CacheService::rememberListingKey('guides', $cacheKey);

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
        $guide = Cache::remember(CacheService::articleShowKey('guide', $slug), CacheService::TTL_LONG, function () use ($slug) {
            return Guide::where('slug', $slug)
                ->with(['author:id,username,display_name,avatar_url,bio', 'game:id,slug,name,cover_url,released,rating,genres,platforms,critic_scores'])
                ->withCount([
                    'votes as helpful_count' => function ($query) {
                        $query->where('is_helpful', true);
                    },
                    'votes as unhelpful_count' => function ($query) {
                        $query->where('is_helpful', false);
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

    /**
     * Was this guide any use.
     *
     * The method has existed since guides shipped and was never routed, so
     * every guide on the site has been printing "0 found helpful" beside a
     * counter nothing could reach. Pressing the same answer twice withdraws
     * it — a vote you cannot take back is a vote people stop casting.
     *
     * The count lives inside the cached guide payload, so the cache has to go
     * with the vote; otherwise the number the voter just moved keeps reading
     * its old value for the rest of the TTL.
     */
    public function vote(Request $request, $slug)
    {
        $validated = $request->validate([
            'is_helpful' => 'required|boolean',
        ]);

        $guide = Guide::where('slug', $slug)->firstOrFail();
        $userId = Auth::id();

        $existing = GuideVote::where('guide_id', $guide->id)->where('user_id', $userId)->first();

        if ($existing && (bool) $existing->is_helpful === (bool) $validated['is_helpful']) {
            $existing->delete();
            $userVote = null;
        } else {
            GuideVote::updateOrCreate(
                ['guide_id' => $guide->id, 'user_id' => $userId],
                ['is_helpful' => $validated['is_helpful']]
            );
            $userVote = (bool) $validated['is_helpful'];
        }

        Cache::forget("guide.show.v3.{$slug}");

        return $this->success([
            'user_vote' => $userVote,
            'helpful_count' => GuideVote::where('guide_id', $guide->id)->where('is_helpful', true)->count(),
            'unhelpful_count' => GuideVote::where('guide_id', $guide->id)->where('is_helpful', false)->count(),
        ], 'Thanks — that helps us write better ones.');
    }
}
