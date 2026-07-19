<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Post;
use App\Models\User;
use App\Models\UserGame;
use App\Traits\ApiResponse;

class ProfileCompareController extends Controller
{
    use ApiResponse;

    /**
     * GET /compare/{username}/{other}
     * Public comparison of two players.
     */
    public function compare(string $username, string $other)
    {
        $userA = User::where('username', $username)->firstOrFail();
        $userB = User::where('username', $other)->firstOrFail();

        // Shared games (both have in any status)
        $sharedGames = UserGame::where('user_id', $userA->id)
            ->whereIn('game_id', UserGame::where('user_id', $userB->id)->pluck('game_id'))
            ->with('game:id,name,slug,background_image,genre_names')
            ->orderByDesc('hours_played')
            ->limit(12)
            ->get(['game_id', 'status', 'hours_played'])
            ->map(fn ($ug) => [
                'game' => $ug->game ? [
                    'slug' => $ug->game->slug,
                    'name' => $ug->game->name,
                    'background_image' => $ug->game->background_image,
                ] : null,
                'status_a' => UserGame::where('user_id', $userA->id)->where('game_id', $ug->game_id)->value('status'),
                'status_b' => UserGame::where('user_id', $userB->id)->where('game_id', $ug->game_id)->value('status'),
            ]);

        $statsA = $this->profileStats($userA);
        $statsB = $this->profileStats($userB);

        return $this->success([
            'player_a' => $this->playerCard($userA),
            'player_b' => $this->playerCard($userB),
            'stats_a' => $statsA,
            'stats_b' => $statsB,
            'shared_games' => $sharedGames,
            'shared_count' => UserGame::where('user_id', $userA->id)
                ->whereIn('game_id', UserGame::where('user_id', $userB->id)->pluck('game_id'))
                ->count(),
        ]);
    }

    private function playerCard(User $user): array
    {
        return [
            'username' => $user->username,
            'display_name' => $user->display_name ?? $user->name,
            'avatar' => $user->avatar_url,
            'xp' => $user->xp ?? 0,
            'rank' => optional($user->rank)->name,
        ];
    }

    private function profileStats(User $user): array
    {
        $games = UserGame::where('user_id', $user->id);

        return [
            'total_games' => (clone $games)->count(),
            'completed' => (clone $games)->where('status', 'completed')->count(),
            'playing' => (clone $games)->where('status', 'playing')->count(),
            'hours_played' => (int) (clone $games)->sum('hours_played'),
            'reputation' => $user->forum_reputation ?? 0,
            'forum_posts' => Post::where('user_id', $user->id)->count(),
            'articles' => Article::where('author_id', $user->id)->where('status', 'published')->count(),
        ];
    }
}
