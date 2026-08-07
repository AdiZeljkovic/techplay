<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ConnectedAccount;
use App\Models\Friendship;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserCustomization;
use App\Models\UserGame;
use App\Services\Chronicle\TasteProfileService;
use App\Services\LevelService;
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

        $completedThisMonth = UserGame::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->startOfMonth())
            ->count();

        // published reviews only — drafts are private; feeds stats AND completion
        $reviewsCount = GameRating::where('user_id', $user->id)->where('is_draft', false)->count();

        // Accepted friendships, resolved to the *other* user's id (one query,
        // reused for both the counter and the online rail).
        $friendIds = Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->get(['sender_id', 'receiver_id'])
            ->map(fn ($f) => $f->sender_id === $user->id ? $f->receiver_id : $f->sender_id);

        return $this->success([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name ?? $user->name,
                'avatar_url' => $user->avatar_url,
                // relative storage path in the DB — same conversion as PublicUserResource
                'cover_image' => $user->cover_image ? asset('storage/'.$user->cover_image) : null,
                'bio' => $user->bio,
                'location' => $user->location,
                'tagline' => $user->tagline,
                'playstyle_tags' => array_values((array) ($user->playstyle_tags ?? [])),
                'level' => app(LevelService::class)->forXp($user->xp),
                'xp' => (int) ($user->xp ?? 0),
                'rank_name' => $user->rank?->name,
                // the ladder carries a tier colour per rank — the UI paints with it
                'rank_color' => $user->rank?->color,
                'rank_icon' => $user->rank?->icon,
                // where the current band starts — the gauge measures the band,
                // not the whole ladder
                'rank_min_xp' => (int) ($user->rank?->min_xp ?? 0),
                'next_rank' => $nextRank ? [
                    'name' => $nextRank->name,
                    'min_xp' => $nextRank->min_xp,
                    'color' => $nextRank->color,
                    // The hero shows what you are climbing towards, so it needs
                    // the emblem and not only the name.
                    'icon' => $nextRank->icon,
                ] : null,
                // hero identity line: verified tick + the platforms you play on
                'is_staff' => $user->hasRole(['admin', 'Admin', 'Super Admin', 'editor', 'Editor', 'Editor-in-Chief', 'moderator', 'Moderator', 'Journalist'])
                    || in_array(strtolower($user->role ?? ''), ['admin', 'editor', 'moderator', 'journalist', 'super_admin']),
                'member_since' => $user->created_at?->format('M Y'),
                // the handles themselves, not just which platforms exist — the
                // hero prints them under each platform mark
                'gamertags' => array_filter((array) ($user->gamertags ?? [])),
                // a bought avatar frame has to actually show up on the avatar
                'frame' => UserCustomization::where('user_customizations.user_id', $user->id)
                    ->where('user_customizations.is_equipped', true)
                    ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
                    ->where('customizations.type', 'frame')
                    ->value('customizations.value'),
            ],
            'stats' => [
                'games_count' => $counts['games_count'],
                'playing_count' => $counts['playing_count'],
                'backlog_count' => $counts['backlog_count'],
                'completed_count' => $counts['completed_count'],
                'wishlist_count' => $counts['wishlist_count'],
                'favorites_count' => $counts['favorites_count'],
                'achievements_count' => $user->achievements()->count(),
                // catalog size, so the strip can say "68 / 120" — same cache
                // key family as AuthController's catalog
                'achievements_total' => Cache::remember(
                    'achievements.catalog.count.v1',
                    3600,
                    fn () => Achievement::where('is_hidden', false)->count()
                ),
                'reviews_count' => $reviewsCount,
                'completed_this_month' => $completedThisMonth,
                'hours_played' => (int) UserGame::where('user_id', $user->id)->sum('hours_played'),
                'friends_count' => $friendIds->count(),
            ],
            'playing_now' => $this->profileService->playingNow($user, 8),
            // the shelf scrolls now, so it's worth sending more than fits
            'favorites' => $this->gameCovers($user, ['is_favorite' => true], 12),
            'backlog_preview' => $this->gameCovers($user, ['status' => 'backlog'], 4),
            'backlog_suggestion' => $this->backlogSuggestion($user, $libraryGameIds->all()),
            'streak' => $this->streakService->info($user),
            'recent_achievements' => $this->recentAchievements($user),
            'friends_online' => $this->friendsOnline($friendIds->all()),
            'profile_completion' => $this->profileCompletion($user, $counts, $reviewsCount),
        ]);
    }

    /** Latest unlocked achievements, newest first. The shelf shows ten. */
    private function recentAchievements($user): array
    {
        return $user->achievements()
            ->orderByPivot('unlocked_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'icon_path' => $a->versionedIconPath(),
                'points' => (int) $a->points,
                'unlocked_at' => $a->pivot->unlocked_at,
            ])->all();
    }

    /**
     * Friends with an active presence right now. Privacy: only is_active rows
     * leave the server — never last_seen_at or stale sessions.
     */
    private function friendsOnline(array $friendIds): array
    {
        if (! $friendIds) {
            return [];
        }

        // Live presences, keyed for the join below. Privacy: only is_active
        // leaves the server — never last_seen_at or a stale session.
        $presences = Presence::whereIn('user_id', $friendIds)
            ->where('is_active', true)
            ->get(['user_id', 'game_name', 'game_slug'])
            ->keyBy('user_id');

        // The whole friends list, not just whoever happens to be in a game —
        // an empty widget on an account with friends reads as broken.
        return User::whereIn('id', $friendIds)
            ->orderBy('username')
            ->limit(12)
            ->get(['id', 'username', 'display_name', 'avatar_url'])
            ->map(function (User $u) use ($presences) {
                $presence = $presences->get($u->id);

                return [
                    'username' => $u->username,
                    'display_name' => $u->display_name,
                    'avatar_url' => $u->avatar_url,
                    'is_online' => $presence !== null,
                    'game_name' => $presence?->game_name,
                    'game_slug' => $presence?->game_slug,
                ];
            })
            // in a game first, then everyone else alphabetically
            ->sortByDesc('is_online')
            ->values()
            ->all();
    }

    /**
     * How "finished" the profile looks, from cheap signals already on hand.
     * The frontend maps `key` to a settings/action link.
     */
    private function profileCompletion($user, array $counts, int $reviewsCount): array
    {
        $signals = [
            'avatar' => ['label' => 'Add a profile picture', 'done' => ! empty($user->avatar_url)],
            'cover' => ['label' => 'Add a profile banner', 'done' => ! empty($user->cover_image)],
            'bio' => ['label' => 'Write your bio', 'done' => ! empty($user->bio)],
            'location' => ['label' => 'Add location or tagline', 'done' => ! empty($user->location) || ! empty($user->tagline)],
            'playstyle' => ['label' => 'Pick playstyle tags', 'done' => ! empty($user->playstyle_tags)],
            'gamertags' => ['label' => 'Add your gamertags', 'done' => ! empty(array_filter((array) ($user->gamertags ?? [])))],
            'favorite' => ['label' => 'Star a favorite game', 'done' => $counts['favorites_count'] > 0],
            'review' => ['label' => 'Publish a game review', 'done' => $reviewsCount > 0],
            'connect' => ['label' => 'Link a gaming account', 'done' => ConnectedAccount::where('user_id', $user->id)->exists()],
        ];

        $done = count(array_filter($signals, fn ($s) => $s['done']));

        return [
            'percent' => (int) round($done / count($signals) * 100),
            'missing' => collect($signals)
                ->reject(fn ($s) => $s['done'])
                ->map(fn ($s, $key) => ['key' => $key, 'label' => $s['label']])
                ->values()
                ->all(),
        ];
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

        $items = Cache::remember("recommendations:v2:{$user->id}", 3600, function () use ($user) {
            $libraryGameIds = UserGame::where('user_id', $user->id)->pluck('game_id')->all();
            $profile = $this->tasteProfile($user);

            if (! $profile) {
                return [];
            }

            ['weights' => $genreWeights, 'platforms' => $platformSet] = $profile;

            // Candidates: well-rated games sharing at least one top genre, not in the library.
            $query = Game::query()
                ->whereNotIn('id', $libraryGameIds)
                ->whereNotNull('description')
                ->whereNotNull('cover_url')
                ->where('rating', '>', 0);

            if (DB::getDriverName() === 'pgsql') {
                $genreList = array_keys($genreWeights);
                $placeholders = implode(',', array_fill(0, count($genreList), '?'));
                $query->whereRaw("genres && ARRAY[{$placeholders}]::text[]", $genreList);
            }

            $candidates = $query->orderByDesc('rating')->limit(150)
                ->get(['id', 'slug', 'name', 'cover_url', 'rating', 'genres', 'platforms']);

            $scored = [];
            foreach ($candidates as $g) {
                $match = $this->matchAgainstProfile($g, $profile);

                if ($match === null || $match['percent'] < 40) {
                    continue;
                }

                $scored[] = [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'cover_url' => $g->cover_url,
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
     * GET /me/upcoming — the release calendar seen through the chronicle:
     * wishlisted games first (they asked), then whatever upcoming matches
     * their taste. "Upcoming For You" finally earns its name.
     */
    public function upcoming(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = Cache::remember("me.upcoming.v1.{$user->id}", 1800, function () use ($user) {
            $taste = app(TasteProfileService::class);
            $weights = $taste->genreWeights($user);

            $wishlisted = UserGame::where('user_id', $user->id)
                ->where('status', 'wishlist')->pluck('game_id')->flip();

            return Game::query()
                ->whereNotNull('match_key')
                ->whereBetween('released', [now()->toDateString(), now()->addDays(90)->toDateString()])
                ->orderByDesc('hype_score')
                ->limit(60)
                ->get(['id', 'slug', 'name', 'released', 'cover_url', 'genres', 'platforms', 'hype_score'])
                ->map(function (Game $g) use ($weights, $wishlisted) {
                    $fit = 0.0;
                    foreach ((array) $g->genres as $genre) {
                        $fit += (float) ($weights[$genre] ?? 0);
                    }

                    return [
                        'slug' => $g->slug,
                        'name' => $g->name,
                        'released' => $g->released?->toDateString(),
                        'cover_url' => $g->cover_url,
                        'genres' => array_slice((array) $g->genres, 0, 2),
                        'platforms' => array_slice((array) $g->platforms, 0, 4),
                        'reason' => isset($wishlisted[$g->id]) ? 'wishlist' : ($fit > 0.3 ? 'taste' : null),
                        '_sort' => (isset($wishlisted[$g->id]) ? 100 : 0) + $fit * 10 + min(5, ((int) $g->hype_score) / 200),
                    ];
                })
                ->sortByDesc('_sort')
                ->take(8)
                ->map(fn ($row) => collect($row)->except('_sort')->all())
                ->values()
                ->all();
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
            ->with('game:id,slug,name,cover_url,rating,genres,platforms')
            ->orderByDesc('updated_at')
            ->limit(40)
            ->get()
            ->pluck('game')
            ->filter();

        if ($backlog->isEmpty()) {
            return null;
        }

        $profile = $this->tasteProfile($user);
        $best = null;

        if ($profile) {
            foreach ($backlog as $game) {
                $match = $this->matchAgainstProfile($game, $profile);
                if ($match && (! $best || $match['percent'] > $best['match_percent'])) {
                    $best = [
                        'slug' => $game->slug,
                        'name' => $game->name,
                        'cover_url' => $game->cover_url,
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
            'cover_url' => $fallback->cover_url,
            'genres' => array_slice((array) $fallback->genres, 0, 3),
            'match_percent' => null,
        ];
    }

    /**
     * The user's taste profile: weighted top genres + platforms they own on,
     * derived from their library. Null when there's nothing to learn from.
     *
     * @return array{weights: array<string,float>, platforms: array<string,bool>}|null
     */
    private function tasteProfile($user): ?array
    {
        // The chronicle already condensed every signal the site holds —
        // this used to be a second, weaker brain reading only the library.
        $taste = app(TasteProfileService::class);

        $genreWeights = array_slice($taste->genreWeights($user), 0, 5, true);
        if ($genreWeights === []) {
            return null;
        }

        $total = max(1e-6, array_sum($genreWeights));

        return [
            'weights' => array_map(fn ($w) => $w / $total, $genreWeights),
            'platforms' => array_fill_keys(array_keys($taste->platformWeights($user)), true),
            'negative' => $taste->negativeGenres($user),
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

        foreach ((array) $game->genres as $genre) {
            if (isset($weights[$genre])) {
                $genreScore += $weights[$genre];
                $matched[] = $genre;
            }
        }

        if ($genreScore <= 0) {
            return null;
        }

        $platformOverlap = count(array_intersect((array) $game->platforms, array_keys($profile['platforms']))) > 0;
        $rating5 = min(5, (float) $game->rating);
        $score = 0.8 * ($genreScore / array_sum($weights)) + ($platformOverlap ? 0.1 : 0) + 0.1 * ($rating5 / 5);

        // Bounced-off genres push back — the chronicle's negative map.
        foreach ((array) $game->genres as $genre) {
            $score -= 0.3 * (float) (($profile['negative'] ?? [])[$genre] ?? 0);
        }
        if ($score <= 0) {
            return null;
        }

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
            ->with('game:id,slug,name,cover_url')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'cover_url' => $ug->game?->cover_url,
                'hours_played' => (int) ($ug->hours_played ?? 0),
                'progress' => (int) ($ug->progress ?? 0),
                // null means nothing measured it — the shelf says "not tracked"
                // rather than printing a confident 0h
                'playtime_source' => $ug->playtime_source,
                'status' => $ug->status,
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values()
            ->all();
    }
}
