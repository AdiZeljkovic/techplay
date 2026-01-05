<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\RawgService;
use Illuminate\Http\Request;

class GameController extends Controller
{
    protected $rawgService;

    public function __construct(RawgService $rawgService)
    {
        $this->rawgService = $rawgService;
    }

    public function index(Request $request)
    {
        $query = $request->input('search', '');
        $filters = $request->only(['genres', 'platforms', 'dates', 'ordering']);

        $data = $this->rawgService->searchGames($query, $filters);

        if (!$data) {
            return response()->json(['message' => 'Failed to fetch games'], 503);
        }

        return response()->json($data);
    }

    public function show($slug)
    {
        $data = $this->rawgService->getGameDetails($slug);

        if (!$data) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        return response()->json($data);
    }

    public function calendar(Request $request)
    {
        $start = $request->input('start_date', now()->format('Y-m-d'));
        $end = $request->input('end_date', now()->addMonth()->format('Y-m-d'));

        $data = $this->rawgService->getUpcomingReleases($start, $end);

        if (!$data) {
            return response()->json(['message' => 'Failed to fetch calendar'], 503);
        }

        return response()->json($data);
    }
}
