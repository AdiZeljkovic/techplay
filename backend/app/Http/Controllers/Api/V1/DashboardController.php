<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GameRating;
use App\Models\UserGame;
use App\Services\ProfileService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(protected ProfileService $profileService) {}

    /**
     * GET /me/dashboard — aggregated payload for the logged-in homepage dashboard.
     *
     * Read-only composite: mutations (streak claim, quest claims) and independently
     * refreshed feeds (upcoming releases, friend activity, personalized feed) stay
     * on their own endpoints so their widgets remain the single source of truth.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $counts = $this->profileService->collectionCounts($user);
        $nextRank = $user->nextRank();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name ?? $user->name,
                'avatar_url' => $user->avatar_url,
                'level' => (int) floor(($user->xp ?? 0) / 1000) + 1,
                'xp' => (int) ($user->xp ?? 0),
                'rank_name' => $user->rank?->name,
                'next_rank' => $nextRank ? [
                    'name' => $nextRank->name,
                    'min_xp' => $nextRank->min_xp,
                ] : null,
            ],
            'stats' => [
                'games_count' => $counts['games_count'],
                'playing_count' => $counts['playing_count'],
                'backlog_count' => $counts['backlog_count'],
                'completed_count' => $counts['completed_count'],
                'wishlist_count' => $counts['wishlist_count'],
                'favorites_count' => $counts['favorites_count'],
                'achievements_count' => $user->achievements()->count(),
                'reviews_count' => GameRating::where('user_id', $user->id)->count(),
            ],
            'playing_now' => $this->profileService->playingNow($user, 8),
            'favorites' => $this->gameCovers($user, ['is_favorite' => true], 6),
            'backlog_preview' => $this->gameCovers($user, ['status' => 'backlog'], 4),
            'streak' => [
                'days' => $user->daily_streak ?? 0,
                'claimed_today' => $user->last_daily_claim && Carbon::parse($user->last_daily_claim)->isToday(),
            ],
        ]);
    }

    /**
     * Small cover strips (favorites, backlog preview).
     */
    private function gameCovers($user, array $where, int $limit): array
    {
        return UserGame::where('user_id', $user->id)
            ->where($where)
            ->with('game:id,slug,name,background_image')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'background_image' => $ug->game?->background_image,
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values()
            ->all();
    }
}
