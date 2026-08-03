<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Models\UserGame;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FeedController extends Controller
{
    use ApiResponse;

    /**
     * GET /feed/personalized — articles ranked by user's genres + wishlisted games.
     */
    public function personalized(): JsonResponse
    {
        $userId = Auth::id();

        // 1. Preferred genres from the user's collection (top 5 by count).
        $preferredGenres = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $userId)
            ->selectRaw('unnest(games.genre_names::text[]) as genre, count(*) as cnt')
            ->groupBy('genre')
            ->orderByDesc('cnt')
            ->limit(5)
            ->pluck('genre')
            ->map(fn ($g) => strtolower($g))
            ->all();

        // 2. Game IDs the user wishlisted.
        $wishlistedGameIds = UserGame::where('user_id', $userId)
            ->where('status', 'wishlist')
            ->pluck('game_id')
            ->all();

        // 3. Fetch recent published articles.
        $articles = Article::where('status', 'published')
            ->where('published_at', '<=', now())
            ->with(['author', 'category', 'game'])
            ->latest('published_at')
            ->limit(60)
            ->get();

        // 4. Score each article.
        $scored = $articles->map(function (Article $article) use ($preferredGenres, $wishlistedGameIds) {
            $score = 0;

            // +5 if article's game is in wishlist
            if ($article->game_id && in_array($article->game_id, $wishlistedGameIds)) {
                $score += 5;
            }

            // +2 per matching tag/genre
            $tags = array_map('strtolower', $article->tags ?? []);
            foreach ($preferredGenres as $genre) {
                foreach ($tags as $tag) {
                    if (str_contains($tag, $genre) || str_contains($genre, $tag)) {
                        $score += 2;
                        break;
                    }
                }
            }

            // Recency bonus: 0–3 pts based on how new the article is (max 7 days)
            $daysSince = now()->diffInDays($article->published_at);
            $score += max(0, 3 - $daysSince);

            $article->_feed_score = $score;

            return $article;
        });

        $sorted = $scored->sortByDesc('_feed_score')->take(20)->values();

        return $this->success(ArticleResource::collection($sorted)->resolve());
    }

    /** Category types the editorial filter offers, mapped to category.type. */
    private const FEED_TYPES = ['news', 'review', 'tech', 'guide'];

    /**
     * GET /feed/latest?type=all|news|review|tech|guide&limit=6
     *
     * The newest published articles, optionally narrowed to one section. The
     * per-section controllers each paginate 13 and cache their own way; this
     * exists so one strip can switch sections without four round trips.
     */
    public function latest(Request $request): JsonResponse
    {
        $type = $request->query('type', 'all');
        $limit = min(12, max(1, (int) $request->query('limit', 6)));

        if ($type !== 'all' && ! in_array($type, self::FEED_TYPES, true)) {
            return $this->error('Unknown feed type', 422);
        }

        $cacheKey = "feed.latest.v1.{$type}.{$limit}";

        $articles = Cache::remember($cacheKey, 300, function () use ($type, $limit) {
            return Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->whereHas('category', function ($q) use ($type) {
                    $q->whereIn('type', $type === 'all' ? self::FEED_TYPES : [$type]);
                })
                ->with(['author:id,username,display_name,avatar_url', 'category'])
                ->latest('published_at')
                ->limit($limit)
                ->get();
        });

        return $this->success(ArticleResource::collection($articles)->resolve());
    }
}
