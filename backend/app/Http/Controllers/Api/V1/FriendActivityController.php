<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Friendship;
use App\Models\Presence;
use App\Models\UserGame;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FriendActivityController extends Controller
{
    use ApiResponse;

    /**
     * GET /friends/activity — derive-on-read feed of recent friend actions.
     */
    public function index(): JsonResponse
    {
        $userId = Auth::id();

        $friendIds = Friendship::where(function ($q) use ($userId) {
            $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
        })
            ->where('status', 'accepted')
            ->get()
            ->map(fn ($f) => $f->sender_id === $userId ? $f->receiver_id : $f->sender_id)
            ->values()
            ->all();

        if (empty($friendIds)) {
            return $this->success([]);
        }

        $activities = collect();

        // 1. Currently playing (active presence).
        $presences = Presence::whereIn('user_id', $friendIds)
            ->where('is_active', true)
            ->with('user:id,username,display_name,avatar_url')
            ->orderByDesc('started_at')
            ->limit(10)
            ->get();

        foreach ($presences as $p) {
            $activities->push([
                'type' => 'playing',
                'user' => $this->formatUser($p->user),
                'game_name' => $p->game_name,
                'game_slug' => $p->game_slug,
                'source' => $p->source,
                'created_at' => $p->started_at?->toIso8601String(),
            ]);
        }

        // 2. Recent collection changes (last 7 days).
        $collectionActivity = DB::table('user_games')
            ->join('users', 'users.id', '=', 'user_games.user_id')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->whereIn('user_games.user_id', $friendIds)
            ->where('user_games.updated_at', '>=', now()->subDays(7))
            ->whereIn('user_games.status', [...UserGame::ACTIVE, 'completed', 'backlog', 'wishlist'])
            ->orderByDesc('user_games.updated_at')
            ->limit(20)
            ->select([
                'user_games.status',
                'user_games.updated_at',
                'users.id as user_id',
                'users.username',
                'users.display_name',
                'users.avatar_url',
                'games.name as game_name',
                'games.slug as game_slug',
            ])
            ->get();

        foreach ($collectionActivity as $row) {
            $activities->push([
                'type' => 'collection_'.$row->status,
                'user' => [
                    'id' => $row->user_id,
                    'username' => $row->username,
                    'display_name' => $row->display_name,
                    'avatar_url' => $row->avatar_url,
                ],
                'game_name' => $row->game_name,
                'game_slug' => $row->game_slug,
                'created_at' => $row->updated_at,
            ]);
        }

        // 3. Recent achievement unlocks (last 7 days).
        $achievementActivity = DB::table('user_achievements')
            ->join('users', 'users.id', '=', 'user_achievements.user_id')
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->whereIn('user_achievements.user_id', $friendIds)
            ->where('user_achievements.unlocked_at', '>=', now()->subDays(7))
            ->orderByDesc('user_achievements.unlocked_at')
            ->limit(15)
            ->select([
                'user_achievements.unlocked_at',
                'users.id as user_id',
                'users.username',
                'users.display_name',
                'users.avatar_url',
                'achievements.name as achievement_name',
                'achievements.icon_path',
                'achievements.points',
            ])
            ->get();

        foreach ($achievementActivity as $row) {
            $activities->push([
                'type' => 'achievement',
                'user' => [
                    'id' => $row->user_id,
                    'username' => $row->username,
                    'display_name' => $row->display_name,
                    'avatar_url' => $row->avatar_url,
                ],
                'achievement_name' => $row->achievement_name,
                // Raw row, so there is no model to ask for the stamp.
                'icon_path' => Achievement::stampPath($row->icon_path),
                'points' => $row->points,
                'created_at' => $row->unlocked_at,
            ]);
        }

        // Sort merged results by recency.
        $sorted = $activities
            ->sortByDesc('created_at')
            ->values()
            ->take(30)
            ->all();

        return $this->success($sorted);
    }

    private function formatUser(?object $user): array
    {
        if (! $user) {
            return [];
        }

        return [
            'id' => $user->id,
            'username' => $user->username,
            'display_name' => $user->display_name,
            'avatar_url' => $user->avatar_url,
        ];
    }
}
