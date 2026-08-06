<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleBookmark;
use App\Models\ArticleRead;
use App\Models\GameRating;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class ReadingController extends Controller
{
    use ApiResponse;

    private const SEARCH_HISTORY_SIZE = 8;

    private const SEARCH_HISTORY_TTL = 60 * 60 * 24 * 30;

    /**
     * GET /me/reading — saved articles + what the user is part-way through.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $bookmarks = ArticleBookmark::where('user_id', $user->id)
            ->with('article:id,slug,title,featured_image_url,category_id')
            ->latest()
            ->limit(12)
            ->get()
            ->pluck('article')
            ->filter()
            ->values();

        return $this->success([
            'saved' => [
                'total' => ArticleBookmark::where('user_id', $user->id)->count(),
                'items' => $bookmarks->map(fn (Article $a) => $this->articleStub($a))->all(),
            ],
            'continue_reading' => $this->continueReading($user),
            'recent_searches' => $this->recentSearches($user->id),
            'draft_reviews' => $this->draftReviews($user),
        ]);
    }

    /**
     * POST /articles/{slug}/bookmark — toggle an article in the reading list.
     */
    public function toggleBookmark(Request $request, string $slug): JsonResponse
    {
        $article = Article::where('slug', $slug)->firstOrFail(['id', 'slug']);

        $existing = ArticleBookmark::where('user_id', $request->user()->id)
            ->where('article_id', $article->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return $this->success(['bookmarked' => false], 'Removed from your reading list');
        }

        ArticleBookmark::create(['user_id' => $request->user()->id, 'article_id' => $article->id]);

        return $this->success(['bookmarked' => true], 'Saved to your reading list');
    }

    /**
     * PUT /articles/{slug}/progress — record how far the reader got.
     * Progress only moves forward, so scrolling back up can't erase it.
     */
    public function updateProgress(Request $request, string $slug): JsonResponse
    {
        $data = $request->validate([
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $article = Article::where('slug', $slug)->firstOrFail(['id']);

        $read = ArticleRead::firstOrNew([
            'user_id' => $request->user()->id,
            'article_id' => $article->id,
        ]);

        $read->progress = max($read->progress ?? 0, $data['progress']);
        $read->last_read_at = now();
        $read->save();

        return $this->success(['progress' => $read->progress]);
    }

    /**
     * Records a search term against the user (Redis list, newest first).
     * Best-effort: search must never fail because history couldn't be written.
     */
    public static function rememberSearch(?int $userId, string $term): void
    {
        $term = trim($term);

        if (! $userId || mb_strlen($term) < 2) {
            return;
        }

        try {
            $key = "user:{$userId}:searches";
            Redis::lrem($key, 0, $term);          // no duplicates
            Redis::lpush($key, $term);
            Redis::ltrim($key, 0, self::SEARCH_HISTORY_SIZE - 1);
            Redis::expire($key, self::SEARCH_HISTORY_TTL);
        } catch (\Throwable) {
            // Redis unavailable — history is a nicety, not a requirement
        }
    }

    /**
     * The most recent unfinished read (95%+ counts as done).
     */
    private function continueReading($user): ?array
    {
        $read = ArticleRead::where('user_id', $user->id)
            ->where('progress', '<', 95)
            ->where('progress', '>', 0)
            ->whereNotNull('last_read_at')
            ->with('article:id,slug,title,featured_image_url,category_id')
            ->orderByDesc('last_read_at')
            ->first();

        if (! $read?->article) {
            return null;
        }

        return $this->articleStub($read->article) + [
            'progress' => $read->progress,
            'last_read_at' => $read->last_read_at?->toIso8601String(),
        ];
    }

    /**
     * Half-written game reviews waiting to be published.
     */
    private function draftReviews($user): array
    {
        $drafts = GameRating::where('user_id', $user->id)
            ->where('is_draft', true)
            ->with('game:id,slug,name,cover_url')
            ->latest('updated_at')
            ->limit(5)
            ->get();

        return [
            'total' => GameRating::where('user_id', $user->id)->where('is_draft', true)->count(),
            'items' => $drafts
                ->map(fn (GameRating $r) => [
                    'slug' => $r->game?->slug ?? $r->game_slug,
                    'name' => $r->game?->name ?? $r->game_slug,
                    'cover_url' => $r->game?->cover_url,
                    'rating' => $r->rating,
                    'updated_at' => $r->updated_at?->toIso8601String(),
                ])
                ->all(),
        ];
    }

    private function recentSearches(int $userId): array
    {
        try {
            return array_values(Redis::lrange("user:{$userId}:searches", 0, self::SEARCH_HISTORY_SIZE - 1) ?: []);
        } catch (\Throwable) {
            return [];
        }
    }

    private function articleStub(Article $article): array
    {
        $article->loadMissing('category:id,name,type');

        return [
            'slug' => $article->slug,
            'title' => $article->title,
            'featured_image_url' => $article->featured_image_url,
            'category' => $article->category?->name,
            'category_type' => $article->category?->type,
        ];
    }
}
