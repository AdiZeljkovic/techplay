<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserGame;
use Illuminate\Support\Facades\DB;

/**
 * Computes derived profile-dashboard data (game collection aggregates,
 * platform/genre breakdowns, gamer DNA). Reputation / ranking / milestones
 * are added in later phases.
 */
class ProfileService
{
    /**
     * Counts per status + favorites + total. Single grouped query.
     *
     * @return array{games_count:int,playing_count:int,backlog_count:int,completed_count:int,wishlist_count:int,dropped_count:int,favorites_count:int}
     */
    public function collectionCounts(User $user): array
    {
        $byStatus = UserGame::where('user_id', $user->id)
            ->select('status', DB::raw('count(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status');

        $favorites = UserGame::where('user_id', $user->id)->where('is_favorite', true)->count();

        return [
            'games_count' => (int) $byStatus->sum(),
            'playing_count' => (int) ($byStatus['playing'] ?? 0),
            'backlog_count' => (int) ($byStatus['backlog'] ?? 0),
            'completed_count' => (int) ($byStatus['completed'] ?? 0),
            'wishlist_count' => (int) ($byStatus['wishlist'] ?? 0),
            'dropped_count' => (int) ($byStatus['dropped'] ?? 0),
            'favorites_count' => (int) $favorites,
        ];
    }

    /**
     * The "Playing Now" rail — in-progress games with progress %.
     */
    public function playingNow(User $user, int $limit = 6): array
    {
        return UserGame::where('user_id', $user->id)
            ->where('status', 'playing')
            ->with(['game:id,slug,name,background_image,platform_names'])
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'background_image' => $ug->game?->background_image,
                'platform_names' => $ug->game?->platform_names ?? [],
                'progress' => $ug->progress,
                'hours_played' => $ug->hours_played,
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values()
            ->all();
    }

    /**
     * Platform + genre distribution across the whole collection, as
     * percentages of the collection size (top N each).
     *
     * @return array{platforms:array<int,array{name:string,count:int,percent:int}>,genres:array<int,array{name:string,count:int,percent:int}>,total:int}
     */
    public function platformsAndGenres(User $user, int $top = 5): array
    {
        $games = UserGame::where('user_id', $user->id)
            ->with(['game:id,platform_names,genre_names'])
            ->get()
            ->map(fn (UserGame $ug) => $ug->game)
            ->filter();

        $total = $games->count();
        $platforms = [];
        $genres = [];

        foreach ($games as $game) {
            foreach (($game->platform_names ?? []) as $p) {
                $p = trim((string) $p);
                if ($p !== '') {
                    $platforms[$p] = ($platforms[$p] ?? 0) + 1;
                }
            }
            foreach (($game->genre_names ?? []) as $g) {
                $g = trim((string) $g);
                if ($g !== '') {
                    $genres[$g] = ($genres[$g] ?? 0) + 1;
                }
            }
        }

        $format = function (array $counts) use ($total, $top) {
            arsort($counts);
            $counts = array_slice($counts, 0, $top, true);
            $out = [];
            foreach ($counts as $name => $count) {
                $out[] = [
                    'name' => $name,
                    'count' => $count,
                    'percent' => $total > 0 ? (int) round(($count / $total) * 100) : 0,
                ];
            }

            return $out;
        };

        return [
            'platforms' => $format($platforms),
            'genres' => $format($genres),
            'total' => $total,
        ];
    }

    /**
     * Gamer DNA — favorite genres/platforms (from collection), playstyle tags
     * (user-set), and favorite franchises (favorited games' series names).
     */
    public function gamerDna(User $user): array
    {
        $pg = $this->platformsAndGenres($user, 4);

        $franchises = UserGame::where('user_id', $user->id)
            ->where('is_favorite', true)
            ->with(['game:id,moby_group_name'])
            ->get()
            ->map(fn (UserGame $ug) => $ug->game?->moby_group_name)
            ->filter()
            ->unique()
            ->take(5)
            ->values()
            ->all();

        return [
            'genres' => $pg['genres'],
            'platforms' => $pg['platforms'],
            'playstyle' => $user->playstyle_tags ?? [],
            'franchises' => $franchises,
        ];
    }
}
