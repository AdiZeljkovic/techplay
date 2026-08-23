<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DiscordLeaderboardController extends Controller
{
    /**
     * Get Top 10 Users by XP.
     */
    public function top(Request $request)
    {
        // PERFORMANCE: Use eager loading to prevent N+1 query
        $users = User::with('rank')
            ->orderBy('xp', 'desc')
            ->take(10)
            ->get(['id', 'username', 'display_name', 'xp', 'rank_id']);

        $data = $users->map(function ($user, $index) {
            return [
                'rank_position' => $index + 1,
                'username' => $user->username,
                'name' => $user->display_name ?? $user->username,
                'xp' => $user->xp,
                'rank_title' => $user->rank?->name ?? 'Newcomer',
            ];
        });

        return response()->json([
            'data' => $data,
        ])->header('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    }
}
