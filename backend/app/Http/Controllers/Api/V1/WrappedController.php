<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WrappedController extends Controller
{
    use ApiResponse;

    /**
     * GET /users/{username}/wrapped/{year} — Year-in-Review stats.
     */
    public function show(string $username, int $year): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        $start = "{$year}-01-01";
        $end = "{$year}-12-31 23:59:59";

        // Games completed this year
        $completedThisYear = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->where('user_games.status', 'completed')
            ->whereBetween('user_games.updated_at', [$start, $end])
            ->select('games.name', 'games.slug', 'games.background_image', 'user_games.hours_played')
            ->orderByDesc('user_games.hours_played')
            ->get();

        // Total hours played across all statuses this year
        $totalHours = DB::table('user_games')
            ->where('user_id', $user->id)
            ->whereBetween('updated_at', [$start, $end])
            ->sum('hours_played');

        // Most played game this year
        $mostPlayed = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereBetween('user_games.updated_at', [$start, $end])
            ->orderByDesc('user_games.hours_played')
            ->select('games.name', 'games.slug', 'games.background_image', 'user_games.hours_played')
            ->first();

        // Achievements unlocked this year
        $achievementsThisYear = DB::table('user_achievements')
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->where('user_achievements.user_id', $user->id)
            ->whereBetween('user_achievements.unlocked_at', [$start, $end])
            ->select('achievements.name', 'achievements.icon_path', 'achievements.points')
            ->orderByDesc('achievements.points')
            ->get();

        // Top genre this year (from collection updated this year)
        $topGenre = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereBetween('user_games.updated_at', [$start, $end])
            ->selectRaw('unnest(games.genre_names::text[]) as genre, count(*) as cnt')
            ->groupBy('genre')
            ->orderByDesc('cnt')
            ->value('genre');

        // Games added this year
        $gamesAdded = DB::table('user_games')
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        // Gamer type based on dominant genre
        $gamerType = $this->gamerType($topGenre);

        return $this->success([
            'year' => $year,
            'username' => $user->username,
            'display_name' => $user->display_name ?? $user->username,
            'avatar_url' => $user->avatar_url,
            'gamer_type' => $gamerType,
            'top_genre' => $topGenre,
            'total_hours' => (int) $totalHours,
            'games_added' => $gamesAdded,
            'games_completed' => $completedThisYear->count(),
            'most_played' => $mostPlayed,
            'completed_games' => $completedThisYear->take(10)->values(),
            'achievements' => $achievementsThisYear->count(),
            'top_achievements' => $achievementsThisYear->take(5)->values(),
        ]);
    }

    private function gamerType(?string $genre): string
    {
        if (! $genre) {
            return 'Gamer';
        }
        $g = strtolower($genre);

        return match (true) {
            str_contains($g, 'role') || str_contains($g, 'rpg') => 'RPG Adventurer',
            str_contains($g, 'action') || str_contains($g, 'shooter') => 'Action Hero',
            str_contains($g, 'strateg') || str_contains($g, 'simulation') => 'Strategic Mind',
            str_contains($g, 'sport') || str_contains($g, 'racing') => 'Competitive Spirit',
            str_contains($g, 'horror') || str_contains($g, 'survival') => 'Survivor',
            str_contains($g, 'puzzle') || str_contains($g, 'adventure') => 'Puzzle Master',
            str_contains($g, 'indie') => 'Indie Explorer',
            default => 'All-Around Gamer',
        };
    }
}
