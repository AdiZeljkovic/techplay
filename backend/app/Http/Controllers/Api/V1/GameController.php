<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function crawledSlugs()
    {
        $slugs = Game::whereNotNull('details_crawled_at')
            ->orderByDesc('rating')
            ->limit(2000)
            ->pluck('slug');

        return response()->json($slugs);
    }

    public function index(Request $request)
    {
        $query    = $request->input('search', '');
        $page     = max(1, (int) $request->input('page', 1));
        $pageSize = min(40, max(10, (int) $request->input('page_size', 20)));

        $games = Game::query()
            ->when($query, fn ($q) => $q->where('name', 'ilike', "%{$query}%"))
            ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
            ->orderByDesc('rating')
            ->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'count'    => $games->total(),
            'next'     => $games->hasMorePages() ? $request->fullUrlWithQuery(['page' => $page + 1]) : null,
            'previous' => $page > 1 ? $request->fullUrlWithQuery(['page' => $page - 1]) : null,
            'results'  => $games->items(),
        ]);
    }

    public function show(string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        return response()->json($game->details_data ?? $game->toArray());
    }

    public function screenshots(string $slug)
    {
        $data = Game::where('slug', $slug)->value('screenshots_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function movies(string $slug)
    {
        $data = Game::where('slug', $slug)->value('movies_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function series(string $slug)
    {
        $data = Game::where('slug', $slug)->value('series_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function suggested(string $slug)
    {
        $data = Game::where('slug', $slug)->value('suggested_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function additions(string $slug)
    {
        $data = Game::where('slug', $slug)->value('additions_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function calendar(Request $request)
    {
        $games = Game::query()
            ->whereNotNull('released')
            ->where('released', '>=', now()->toDateString())
            ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
            ->orderBy('released')
            ->limit(20)
            ->get();

        return response()->json(['count' => $games->count(), 'results' => $games]);
    }
}
