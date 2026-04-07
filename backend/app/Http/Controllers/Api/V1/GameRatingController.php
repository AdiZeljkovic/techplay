<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GameRating;
use Illuminate\Http\Request;
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
        $page    = (int) $request->input('page', 1);
        $perPage = 24;
        $sort    = $request->input('sort', 'rating'); // rating|metacritic|released|name

        $allowed = ['genre', 'platform', 'year', 'tag'];
        if (! in_array($type, $allowed)) {
            return response()->json(['message' => 'Invalid hub type'], 400);
        }

        // URL slug → exact genre name stored in DB (Kaggle CSV names)
        $genreNameMap = [
            'action'               => 'Action',
            'indie'                => 'Indie',
            'adventure'            => 'Adventure',
            'rpg'                  => 'RPG',
            'strategy'             => 'Strategy',
            'shooter'              => 'Shooter',
            'casual'               => 'Casual',
            'simulation'           => 'Simulation',
            'puzzle'               => 'Puzzle',
            'arcade'               => 'Arcade',
            'platformer'           => 'Platformer',
            'racing'               => 'Racing',
            'sports'               => 'Sports',
            'massively-multiplayer'=> 'Massively Multiplayer',
            'family'               => 'Family',
            'fighting'             => 'Fighting',
            'board-games'          => 'Board Games',
            'educational'          => 'Educational',
            'card'                 => 'Card',
            'dungeon-crawler'      => 'Dungeon Crawler',
            'point-and-click'      => 'Point & Click',
            'horror'               => 'Horror',
            'first-person'         => 'First-Person',
        ];

        $query = \App\Models\Game::whereNotNull('details_crawled_at')
            ->whereRaw("details_data->>'description_raw' IS NOT NULL")
            ->whereRaw("LENGTH(details_data->>'description_raw') > 50");

        match ($type) {
            'genre'    => $query->whereRaw(
                "EXISTS (SELECT 1 FROM json_array_elements(COALESCE(details_data->'genres', '[]'::json)) g WHERE lower(g->>'name') = ?)",
                [strtolower($genreNameMap[$value] ?? str_replace('-', ' ', $value))]
            ),
            'platform' => $query->whereRaw(
                "EXISTS (SELECT 1 FROM json_array_elements(COALESCE(platforms, '[]'::json)) p WHERE lower(p->'platform'->>'name') ILIKE ?)",
                ['%' . strtolower(str_replace('-', ' ', $value)) . '%']
            ),
            'year'     => $query->whereRaw("EXTRACT(YEAR FROM released) = ?", [(int) $value]),
            'tag'      => $query->whereRaw(
                "EXISTS (SELECT 1 FROM json_array_elements(COALESCE(details_data->'tags', '[]'::json)) t WHERE lower(t->>'name') = ?)",
                [strtolower(str_replace('-', ' ', $value))]
            ),
        };

        $orderColumn = match ($sort) {
            'metacritic' => 'metacritic',
            'released'   => 'released',
            'name'       => 'name',
            default      => 'rating',
        };

        $total   = $query->count();
        $games   = $query->orderByDesc($orderColumn)
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
            ->map(fn ($g) => [
                'id'               => $g->id,
                'name'             => $g->name,
                'slug'             => $g->slug,
                'released'         => $g->released?->format('Y-m-d'),
                'background_image' => $g->background_image,
                'rating'           => $g->rating ? (float) $g->rating : null,
                'metacritic'       => $g->metacritic,
                'platforms'        => $g->platforms ?? [],
                'genres'           => [],
            ]);

        return response()->json([
            'type'       => $type,
            'value'      => $value,
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $perPage,
            'last_page'  => (int) ceil($total / $perPage),
            'results'    => $games,
        ]);
    }
}
