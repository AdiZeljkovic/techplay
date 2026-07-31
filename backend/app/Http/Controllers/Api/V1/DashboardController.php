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

        $completedThisMonth = UserGame::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->startOfMonth())
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
                'completed_this_month' => $completedThisMonth,
            ],
            'playing_now' => $this->profileService->playingNow($user, 8),
            'favorites' => $this->gameCovers($user, ['is_favorite' => true], 6),
            'backlog_preview' => $this->gameCovers($user, ['status' => 'backlog'], 4),
            'backlog_suggestion' => $this->backlogSuggestion($user, $libraryGameIds->all()),
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
            $profile = $this->tasteProfile($libraryGameIds);

            if (! $profile) {
                return [];
            }

            ['weights' => $genreWeights, 'platforms' => $platformSet] = $profile;

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

            $scored = [];
            foreach ($candidates as $g) {
                $match = $this->matchAgainstProfile($g, $profile);

                if ($match === null || $match['percent'] < 40) {
                    continue;
                }

                $scored[] = [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'background_image' => $g->background_image,
                    'rating' => $g->rating,
                    'match_percent' => $match['percent'],
                    'matched_genres' => $match['genres'],
                ];
            }

            usort($scored, fn ($a, $b) => $b['match_percent'] <=> $a['match_percent']);

            return array_slice($scored, 0, 8);
        });

        return $this->success($items);
    }

    /**
     * The backlog game that best fits the user's taste — "play this next".
     * Falls back to the most recently added backlog entry when nothing scores.
     */
    private function backlogSuggestion($user, array $libraryGameIds): ?array
    {
        $backlog = UserGame::where('user_id', $user->id)
            ->where('status', 'backlog')
            ->with('game:id,slug,name,background_image,rating,genre_names,platform_names')
            ->orderByDesc('updated_at')
            ->limit(40)
            ->get()
            ->pluck('game')
            ->filter();

        if ($backlog->isEmpty()) {
            return null;
        }

        $profile = $this->tasteProfile($libraryGameIds);
        $best = null;

        if ($profile) {
            foreach ($backlog as $game) {
                $match = $this->matchAgainstProfile($game, $profile);
                if ($match && (! $best || $match['percent'] > $best['match_percent'])) {
                    $best = [
                        'slug' => $game->slug,
                        'name' => $game->name,
                        'background_image' => $game->background_image,
                        'genres' => $match['genres'],
                        'match_percent' => $match['percent'],
                    ];
                }
            }
        }

        if ($best) {
            return $best;
        }

        $fallback = $backlog->first();

        return [
            'slug' => $fallback->slug,
            'name' => $fallback->name,
            'background_image' => $fallback->background_image,
            'genres' => array_slice((array) $fallback->genre_names, 0, 3),
            'match_percent' => null,
        ];
    }

    /**
     * The user's taste profile: weighted top genres + platforms they own on,
     * derived from their library. Null when there's nothing to learn from.
     *
     * @return array{weights: array<string,float>, platforms: array<string,bool>}|null
     */
    private function tasteProfile(array $libraryGameIds): ?array
    {
        if (count($libraryGameIds) === 0) {
            return null;
        }

        // Computed in PHP so the same code runs on pgsql and sqlite
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
            return null;
        }

        arsort($genreCounts);
        $topGenres = array_slice($genreCounts, 0, 5, true);
        $total = array_sum($topGenres);

        return [
            'weights' => array_map(fn ($c) => $c / $total, $topGenres),
            'platforms' => $platformSet,
        ];
    }

    /**
     * Score one game against a taste profile: 80% genre fit, 10% platform
     * overlap, 10% quality. Null when the game shares no genre with the profile.
     *
     * @return array{percent: int, genres: array<int,string>}|null
     */
    private function matchAgainstProfile(Game $game, array $profile): ?array
    {
        $weights = $profile['weights'];
        $genreScore = 0.0;
        $matched = [];

        foreach ((array) $game->genre_names as $genre) {
            if (isset($weights[$genre])) {
                $genreScore += $weights[$genre];
                $matched[] = $genre;
            }
        }

        if ($genreScore <= 0) {
            return null;
        }

        $platformOverlap = count(array_intersect((array) $game->platform_names, array_keys($profile['platforms']))) > 0;
        $rating5 = min(5, (float) $game->rating);
        $score = 0.8 * ($genreScore / array_sum($weights)) + ($platformOverlap ? 0.1 : 0) + 0.1 * ($rating5 / 5);

        return [
            'percent' => (int) round(min(0.99, $score) * 100),
            'genres' => array_slice($matched, 0, 3),
        ];
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
