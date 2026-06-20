<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SteamAchievement;
use App\Models\User;
use App\Traits\ApiResponse;

class SteamAchievementController extends Controller
{
    use ApiResponse;

    /**
     * GET /users/{username}/steam-achievements
     * Returns imported Steam achievements grouped by game.
     */
    public function index(string $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $achieved = SteamAchievement::where('user_id', $user->id)
            ->where('achieved', true)
            ->with('game:id,name,slug,background_image')
            ->orderByDesc('achieved_at')
            ->limit(100)
            ->get(['id', 'game_id', 'steam_appid', 'display_name', 'description', 'icon_url', 'achieved_at']);

        $total = SteamAchievement::where('user_id', $user->id)->count();
        $achievedCount = SteamAchievement::where('user_id', $user->id)->where('achieved', true)->count();

        return $this->success([
            'total' => $total,
            'achieved' => $achievedCount,
            'completion_pct' => $total > 0 ? round(($achievedCount / $total) * 100) : 0,
            'items' => $achieved,
        ]);
    }
}
