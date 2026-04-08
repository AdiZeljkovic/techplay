<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GameRating;
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
        $aggregate = GameRating::where('game_slug', $slug)
            ->selectRaw('COUNT(*) as count, AVG(rating) as average, ' .
                'SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as r5, ' .
                'SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as r4, ' .
                'SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as r3, ' .
                'SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as r2, ' .
                'SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as r1')
            ->first();

        $reviews = GameRating::where('game_slug', $slug)
            ->whereNotNull('review')
            ->with('user:id,name,username,avatar')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'aggregate' => [
                'count'   => (int) $aggregate->count,
                'average' => $aggregate->count > 0 ? round((float) $aggregate->average, 2) : null,
                'distribution' => [
                    5 => (int) $aggregate->r5,
                    4 => (int) $aggregate->r4,
                    3 => (int) $aggregate->r3,
                    2 => (int) $aggregate->r2,
                    1 => (int) $aggregate->r1,
                ],
            ],
            'reviews' => $reviews,
        ]);
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
        ]);

        $rating = GameRating::updateOrCreate(
            ['user_id' => $request->user()->id, 'game_slug' => $slug],
            $validated
        );

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
        $page    = max(1, (int) $request->input('page', 1));
        $perPage = 24;
        $sort    = $request->input('sort', 'rating');

        $allowed = ['genre', 'platform', 'year', 'tag'];
        if (! in_array($type, $allowed)) {
            return response()->json(['message' => 'Invalid hub type'], 400);
        }

        $cacheKey = "hub:{$type}:{$value}:{$sort}:{$page}";

        $result = Cache::remember($cacheKey, 600, function () use ($type, $value, $sort, $page, $perPage) {
            $genreMap = [
                'action'                => 'Action',
                'indie'                 => 'Indie',
                'adventure'             => 'Adventure',
                'rpg'                   => 'RPG',
                'strategy'              => 'Strategy',
                'shooter'               => 'Shooter',
                'casual'                => 'Casual',
                'simulation'            => 'Simulation',
                'puzzle'                => 'Puzzle',
                'arcade'                => 'Arcade',
                'platformer'            => 'Platformer',
                'racing'                => 'Racing',
                'sports'                => 'Sports',
                'massively-multiplayer' => 'Massively Multiplayer',
                'family'                => 'Family',
                'fighting'              => 'Fighting',
                'board-games'           => 'Board Games',
                'educational'           => 'Educational',
                'card'                  => 'Card',
                'dungeon-crawler'       => 'Dungeon Crawler',
                'point-and-click'       => 'Point & Click',
                'horror'                => 'Horror',
                'first-person'          => 'First-Person',
            ];

            $orderCol = match ($sort) {
                'metacritic' => 'metacritic',
                'released'   => 'released',
                'name'       => 'name',
                default      => 'rating',
            };

            // Build WHERE clause + bindings
            $where    = 'has_description = true';
            $bindings = [];

            if ($type === 'genre') {
                $where     .= ' AND genre_names @> ARRAY[?]::text[]';
                $bindings[] = $genreMap[$value] ?? ucwords(str_replace('-', ' ', $value));
            } elseif ($type === 'platform') {
                $where     .= ' AND platform_names @> ARRAY[?]::text[]';
                $bindings[] = strtolower(str_replace('-', ' ', $value));
            } elseif ($type === 'year') {
                $where     .= ' AND EXTRACT(YEAR FROM released) = ?';
                $bindings[] = (int) $value;
            } elseif ($type === 'tag') {
                $where     .= ' AND tag_names @> ARRAY[?]::text[]';
                $bindings[] = strtolower(str_replace('-', ' ', $value));
            }

            $offset   = ($page - 1) * $perPage;
            $orderDir = ($orderCol === 'name') ? 'ASC' : 'DESC NULLS LAST';

            // Single query — COUNT(*) OVER() avoids a second round-trip
            $rows = DB::select("
                SELECT id, slug, name, released, rating, metacritic,
                       background_image, platforms,
                       COUNT(*) OVER() AS total_count
                FROM games
                WHERE {$where}
                ORDER BY {$orderCol} {$orderDir}
                LIMIT {$perPage} OFFSET {$offset}
            ", $bindings);

            $total = empty($rows) ? 0 : (int) $rows[0]->total_count;

            $games = array_map(fn ($r) => [
                'id'               => $r->id,
                'name'             => $r->name,
                'slug'             => $r->slug,
                'released'         => $r->released,
                'background_image' => $r->background_image,
                'rating'           => $r->rating ? (float) $r->rating : null,
                'metacritic'       => $r->metacritic ? (int) $r->metacritic : null,
                'platforms'        => json_decode($r->platforms ?? '[]', true) ?? [],
            ], $rows);

            return [
                'type'      => $type,
                'value'     => $value,
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
                'results'   => $games,
            ];
        });

        return response()->json($result);
    }
}
