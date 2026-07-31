<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\UserGame;
use App\Services\ProfileService;
use App\Services\StreakService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProfileService $profileService,
        protected StreakService $streakService,
    ) {}

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
        $libraryGameIds = UserGame::where('user_id', $user->id)->pluck('game_id');

        // Fresh coverage of games the user tracks (the "new updates" chip)
        $updatesFromFollowed = $libraryGameIds->isEmpty() ? 0 : Article::query()
            ->whereIn('game_id', $libraryGameIds)
            ->where('status', 'published')
            ->where('published_at', '>=', now()->subDays(7))
            ->where('published_at', '<=', now())
            ->count();

        // Tracked games landing within the week
        $releasesThisWeek = UserGame::where('user_id', $user->id)
            ->whereIn('status', ['wishlist', 'backlog'])
            ->whereHas('game', fn ($q) => $q
                ->whereNotNull('released')
                ->whereDate('released', '>=', now())
                ->whereDate('released', '<=', now()->addDays(7)))
            ->count();

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
            'streak' => $this->streakService->info($user),
            'highlights' => [
                'updates_from_followed' => $updatesFromFollowed,
                'releases_this_week' => $releasesThisWeek,
            ],
        ]);
    }

    /**
     * GET /me/recommendations — personalized game picks with a match score.
     *
     * Match % = how much of the user's genre profile (from their library)
     * a candidate covers, plus small platform-overlap and rating bonuses.
     * Candidates are top-rated games not already in the library. Cached 1h.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = Cache::remember("recommendations:v1:{$user->id}", 3600, function () use ($user) {
            $libraryGameIds = UserGame::where('user_id', $user->id)->pluck('game_id')->all();

            if (count($libraryGameIds) === 0) {
                return [];
            }

            // Genre + platform profile computed in PHP (portable across pgsql/sqlite)
            $libraryGames = Game::whereIn('id', array_slice($libraryGameIds, 0, 300))
                ->get(['id', 'genre_names', 'platform_names']);

            $genreCounts = [];
            $platformSet = [];
            foreach ($libraryGames as $g) {
                foreach ((array) $g->genre_names as $genre) {
                    $genreCounts[$genre] = ($genreCounts[$genre] ?? 0) + 1;
                }
                foreach ((array) $g->platform_names as $p) {
                    $platformSet[$p] = true;
                }
            }
            if (! $genreCounts) {
                return [];
            }

            arsort($genreCounts);
            $topGenres = array_slice($genreCounts, 0, 5, true);
            $total = array_sum($topGenres);
            $genreWeights = array_map(fn ($c) => $c / $total, $topGenres);

            // Candidates: well-rated games sharing at least one top genre, not in the library.
            $query = Game::query()
                ->whereNotIn('id', $libraryGameIds)
                ->where('has_description', true)
                ->whereNotNull('background_image')
                ->where('rating', '>', 0);

            if (DB::getDriverName() === 'pgsql') {
                $genreList = array_keys($genreWeights);
                $placeholders = implode(',', array_fill(0, count($genreList), '?'));
                $query->whereRaw("genre_names && ARRAY[{$placeholders}]::text[]", $genreList);
            }

            $candidates = $query->orderByDesc('rating')->limit(150)
                ->get(['id', 'slug', 'name', 'background_image', 'rating', 'metacritic', 'genre_names', 'platform_names']);

            // Best possible genre coverage = all top genres present
            $maxGenreScore = array_sum($genreWeights);

            $scored = [];
            foreach ($candidates as $g) {
                $genres = (array) $g->genre_names;
                $genreScore = 0.0;
                $matched = [];
                foreach ($genres as $genre) {
                    if (isset($genreWeights[$genre])) {
                        $genreScore += $genreWeights[$genre];
                        $matched[] = $genre;
                    }
                }
                if ($genreScore <= 0) {
                    continue;
                }

                $platformOverlap = count(array_intersect((array) $g->platform_names, array_keys($platformSet))) > 0;
                $rating5 = min(5, (float) $g->rating);

                // 80% genre fit + 10% platform + 10% quality
                $score = 0.8 * ($genreScore / $maxGenreScore) + ($platformOverlap ? 0.1 : 0) + 0.1 * ($rating5 / 5);
                $match = (int) round(min(0.99, $score) * 100);

                if ($match < 40) {
                    continue;
                }

                $scored[] = [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'background_image' => $g->background_image,
                    'rating' => $g->rating,
                    'match_percent' => $match,
                    'matched_genres' => array_slice($matched, 0, 3),
                ];
            }

            usort($scored, fn ($a, $b) => $b['match_percent'] <=> $a['match_percent']);

            return array_slice($scored, 0, 8);
        });

        return $this->success($items);
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
