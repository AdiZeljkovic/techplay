<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Services\IgdbService;
use Illuminate\Http\Request;

class GameController extends Controller
{
    protected $igdbService;

    public function __construct(IgdbService $igdbService)
    {
        $this->igdbService = $igdbService;
    }

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
        $query   = $request->input('search', '');
        $filters = $request->only(['genres', 'platforms', 'dates', 'ordering', 'page', 'page_size']);

        $data = $this->igdbService->searchGames($query, $filters);

        if (! $data) {
            return response()->json(['message' => 'Failed to fetch games'], 503);
        }

        return response()->json($data);
    }

    public function show($slug)
    {
        $data = $this->igdbService->getGameDetails($slug);

        if (! $data) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        return response()->json($data);
    }

    public function screenshots($slug)
    {
        $data = $this->igdbService->getGameScreenshots($slug);
        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function movies($slug)
    {
        $data = $this->igdbService->getGameMovies($slug);
        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function series($slug)
    {
        $data = $this->igdbService->getGameSeries($slug);
        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function suggested($slug)
    {
        $data = $this->igdbService->getGameSuggested($slug);
        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function additions($slug)
    {
        $data = $this->igdbService->getGameAdditions($slug);
        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function calendar(Request $request)
    {
        $start = $request->input('start_date', now()->format('Y-m-d'));
        $end   = $request->input('end_date', now()->addMonth()->format('Y-m-d'));

        $data = $this->igdbService->getUpcomingReleases($start, $end);

        if (! $data) {
            return response()->json(['message' => 'Failed to fetch calendar'], 503);
        }

        return response()->json($data);
    }
}
