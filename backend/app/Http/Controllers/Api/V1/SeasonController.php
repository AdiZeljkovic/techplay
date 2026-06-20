<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Season;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SeasonController extends Controller
{
    use ApiResponse;

    /**
     * GET /seasons/active — the currently active season (or null).
     */
    public function active(): JsonResponse
    {
        $season = Season::active();

        return $this->success($season ? $this->present($season) : null);
    }

    /**
     * GET /seasons — list of all seasons.
     */
    public function index(): JsonResponse
    {
        $seasons = Season::orderByDesc('start_date')->get()->map(fn ($s) => $this->present($s));

        return $this->success($seasons);
    }

    private function present(Season $season): array
    {
        return [
            'id' => $season->id,
            'name' => $season->name,
            'slug' => $season->slug,
            'description' => $season->description,
            'cover_image' => $season->cover_image,
            'badge_image' => $season->badge_image,
            'start_date' => $season->start_date->toDateString(),
            'end_date' => $season->end_date->toDateString(),
            'is_active' => $season->is_active,
            'xp_multiplier' => (float) $season->xp_multiplier,
            'bounty_multiplier' => (float) $season->bounty_multiplier,
            'days_remaining' => $season->is_active ? max(0, now()->diffInDays($season->end_date)) : null,
        ];
    }
}
