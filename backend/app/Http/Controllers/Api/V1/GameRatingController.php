<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Game;
use App\Models\GameRating;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\ClanResourceService;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GameRatingController extends Controller
{
    /**
     * GET /games/{slug}/ratings
     * Public — returns aggregate + paginated reviews
     */
    public function index(string $slug)
    {
        // Drafts are private — excluded from both the score and the review list
        $aggregate = GameRating::where('game_slug', $slug)
            ->where('is_draft', false)
            ->selectRaw('COUNT(*) as count, AVG(rating) as average, '.
                'SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as r5, '.
                'SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as r4, '.
                'SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as r3, '.
                'SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as r2, '.
                'SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as r1')
            ->first();

        $reviews = GameRating::where('game_slug', $slug)
            ->where('is_draft', false)
            ->whereNotNull('review')
            ->with('user:id,name,username,avatar_url')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'aggregate' => [
                'count' => (int) $aggregate->count,
                'average' => $aggregate->count > 0 ? round((float) $aggregate->average, 2) : null,
                'distribution' => [
                    5 => (int) $aggregate->r5,
                    4 => (int) $aggregate->r4,
                    3 => (int) $aggregate->r3,
                    2 => (int) $aggregate->r2,
                    1 => (int) $aggregate->r1,
                ],
            ],
            'techplay_score' => $this->techplayScore($slug, $aggregate),
            'reviews' => $reviews,
        ]);
    }

    /**
     * "TechPlay Score" — blends the editorial review score (articles.review_score
     * via articles.game_id, 0–10) with the community star average (1–5 → 0–10).
     * Editorial weighs 60% when both exist.
     */
    private function techplayScore(string $slug, object $aggregate): ?array
    {
        $editorial = Cache::remember("games.editorial_score.{$slug}", 600, function () use ($slug) {
            $gameId = Game::where('slug', $slug)->value('id');
            if (! $gameId) {
                return null;
            }

            $score = Article::where('game_id', $gameId)
                ->where('status', 'published')
                ->whereNotNull('review_score')
                ->orderByDesc('published_at')
                ->value('review_score');

            return $score !== null ? (float) $score : null;
        });

        $community = $aggregate->count > 0 ? round(((float) $aggregate->average) * 2, 1) : null;

        $score = match (true) {
            $editorial !== null && $community !== null => round(0.6 * $editorial + 0.4 * $community, 1),
            $editorial !== null => round($editorial, 1),
            $community !== null => $community,
            default => null,
        };

        if ($score === null) {
            return null;
        }

        return [
            'score' => $score,
            'editorial' => $editorial,
            'community' => $community,
        ];
    }

    /**
     * GET /games/{slug}/ratings/my
     * Auth — returns current user's rating for this game
     */
    public function my(Request $request, string $slug)
    {
        $rating = GameRating::where('game_slug', $slug)
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json($rating);
    }

    /**
     * POST /games/{slug}/ratings
     * Auth — create or update rating
     */
    public function upsert(Request $request, string $slug)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|min:10|max:1000',
            'is_draft' => 'sometimes|boolean',
        ]);

        if (! empty($validated['review'])) {
            $validated['review'] = strip_tags($validated['review']);
        }

        $validated['is_draft'] = (bool) ($validated['is_draft'] ?? false);
        $validated['game_id'] = Game::where('slug', $slug)->value('id');

        $wasDraft = GameRating::where('user_id', $request->user()->id)
            ->where('game_slug', $slug)
            ->value('is_draft');

        $rating = GameRating::updateOrCreate(
            ['user_id' => $request->user()->id, 'game_slug' => $slug],
            $validated
        );

        // Rewards fire when a review first goes public — drafts earn nothing,
        // and publishing an existing draft still counts as the first time.
        $justPublished = ! $validated['is_draft']
            && ! empty($validated['review'])
            && ($rating->wasRecentlyCreated || $wasDraft);

        if ($justPublished) {
            try {
                app(XpService::class)->awardXp($request->user(), XpService::XP_GAME_REVIEW, 'game_review');
                app(BountyService::class)->award($request->user(), 15, "Game review written: {$slug}", 'milestone');
                app(AchievementService::class)->check($request->user(), ['ratings_count']);
                app(ClanResourceService::class)->award($request->user(), 'review_published');
            } catch (\Throwable) {
            }
        }

        return response()->json($rating, 201);
    }

    /**
     * DELETE /games/{slug}/ratings
     * Auth — remove rating
     */
    public function destroy(Request $request, string $slug)
    {
        GameRating::where('game_slug', $slug)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(null, 204);
    }

    /**
     * GET /games/hub/{type}/{value}
     * Public — hub pages (genre, platform, year, tag)
     */
    public function hub(Request $request, string $type, string $value)
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = 24;
        $sort = $request->input('sort', 'rating');
        $yearFrom = (int) $request->input('year_from', 0);
        $yearTo = (int) $request->input('year_to', 0);
        $platform = trim((string) $request->input('platform', ''));

        $allowed = ['genre', 'platform', 'year', 'tag'];
        if (! in_array($type, $allowed)) {
            return response()->json(['message' => 'Invalid hub type'], 400);
        }

        $cacheKey = "hub:v2:{$type}:{$value}:{$sort}:{$page}:{$yearFrom}:{$yearTo}:{$platform}";

        $result = Cache::remember($cacheKey, 600, function () use ($type, $value, $sort, $page, $perPage, $yearFrom, $yearTo, $platform) {
            $genreMap = [
                'action' => 'Action',
                'indie' => 'Indie',
                'adventure' => 'Adventure',
                'rpg' => 'RPG',
                'strategy' => 'Strategy',
                'shooter' => 'Shooter',
                'casual' => 'Casual',
                'simulation' => 'Simulation',
                'puzzle' => 'Puzzle',
                'arcade' => 'Arcade',
                'platformer' => 'Platformer',
                'racing' => 'Racing',
                'sports' => 'Sports',
                'massively-multiplayer' => 'Massively Multiplayer',
                'family' => 'Family',
                'fighting' => 'Fighting',
                'board-games' => 'Board Games',
                'educational' => 'Educational',
                'card' => 'Card',
                'dungeon-crawler' => 'Dungeon Crawler',
                'point-and-click' => 'Point & Click',
                'horror' => 'Horror',
                'first-person' => 'First-Person',
            ];

            // Platform label → stored platforms value (lowercase partial)
            $platformMap = [
                'pc' => 'pc',
                'playstation' => 'playstation',
                'xbox' => 'xbox',
                'nintendo' => 'nintendo',
                'mobile' => 'android', // stored as android/ios
            ];

            $orderCol = match ($sort) {
                'released' => 'released',
                'name' => 'name',
                default => 'rating',
            };

            $where = 'description IS NOT NULL';
            $bindings = [];

            // Primary hub filter
            if ($type === 'genre') {
                $where .= ' AND genres @> ARRAY[?]::text[]';
                $bindings[] = $genreMap[$value] ?? ucwords(str_replace('-', ' ', $value));
            } elseif ($type === 'platform') {
                $where .= ' AND platforms @> ARRAY[?]::text[]';
                $bindings[] = strtolower(str_replace('-', ' ', $value));
            } elseif ($type === 'year') {
                $where .= ' AND EXTRACT(YEAR FROM released) = ?';
                $bindings[] = (int) $value;
            } elseif ($type === 'tag') {
                $where .= ' AND tags @> ARRAY[?]::text[]';
                $bindings[] = strtolower(str_replace('-', ' ', $value));
            }

            // Additional filters
            if ($yearFrom > 0) {
                $where .= ' AND EXTRACT(YEAR FROM released) >= ?';
                $bindings[] = $yearFrom;
            }
            if ($yearTo > 0) {
                $where .= ' AND EXTRACT(YEAR FROM released) <= ?';
                $bindings[] = $yearTo;
            }
            if ($platform !== '' && $type !== 'platform') {
                $mapped = $platformMap[$platform] ?? strtolower($platform);
                $where .= ' AND EXISTS (SELECT 1 FROM unnest(platforms) p WHERE p LIKE ?)';
                $bindings[] = '%'.$mapped.'%';
            }

            $offset = ($page - 1) * $perPage;
            $orderDir = ($orderCol === 'name') ? 'ASC' : 'DESC NULLS LAST';

            $rows = DB::select("
                SELECT id, slug, name, released, rating,
                       cover_url, array_to_json(platforms) AS platforms,
                       COUNT(*) OVER() AS total_count
                FROM games
                WHERE {$where}
                ORDER BY {$orderCol} {$orderDir}
                LIMIT {$perPage} OFFSET {$offset}
            ", $bindings);

            $total = empty($rows) ? 0 : (int) $rows[0]->total_count;

            $games = array_map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'slug' => $r->slug,
                'released' => $r->released,
                'cover_url' => $r->cover_url,
                'rating' => $r->rating ? (float) $r->rating : null,
                'platforms' => json_decode($r->platforms ?? '[]', true) ?? [],
            ], $rows);

            return [
                'type' => $type,
                'value' => $value,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
                'results' => $games,
            ];
        });

        return response()->json($result);
    }
}
