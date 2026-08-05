<?php

namespace App\Services;

use App\Models\Customization;
use App\Models\Friendship;
use App\Models\GameList;
use App\Models\ReputationSnapshot;
use App\Models\User;
use App\Models\UserCustomization;
use App\Models\UserGame;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Computes derived profile-dashboard data (game collection aggregates,
 * platform/genre breakdowns, gamer DNA). Reputation / ranking / milestones
 * are added in later phases.
 */
class ProfileService
{
    /** Fallbacks used when config is unavailable (e.g. stale config cache during deploy). */
    private const DEFAULT_WEIGHTS = ['post' => 5, 'comment' => 2, 'thread' => 10];

    private const DEFAULT_TIERS = [
        ['name' => 'Rookie', 'min' => 0, 'color' => '#9CA3AF'],
        ['name' => 'Contributor', 'min' => 2000, 'color' => '#4ADE80'],
        ['name' => 'Regular', 'min' => 5000, 'color' => '#60A5FA'],
        ['name' => 'Veteran', 'min' => 10000, 'color' => '#A78BFA'],
        ['name' => 'Elite', 'min' => 20000, 'color' => '#FBBF24'],
        ['name' => 'Legend', 'min' => 40000, 'color' => '#DC143C'],
    ];

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

    /** Total hours across the collection — the hero's "Hours Played" tile. */
    public function hoursPlayed(User $user): int
    {
        return (int) UserGame::where('user_id', $user->id)->sum('hours_played');
    }

    /** Ids of everyone this user has an accepted friendship with. */
    public function friendIds(User $user): array
    {
        return Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->get(['sender_id', 'receiver_id'])
            ->map(fn ($f) => (int) ($f->sender_id === $user->id ? $f->receiver_id : $f->sender_id))
            ->all();
    }

    /**
     * The viewer's relationship to $target, from the viewer's point of view.
     *
     * @return 'self'|'none'|'incoming'|'pending'|'accepted'
     */
    public function friendStatus(User $target, ?User $viewer): string
    {
        if (! $viewer) {
            return 'none';
        }

        if ($viewer->id === $target->id) {
            return 'self';
        }

        $row = Friendship::where(fn ($q) => $q
            ->where(fn ($p) => $p->where('sender_id', $viewer->id)->where('receiver_id', $target->id))
            ->orWhere(fn ($p) => $p->where('sender_id', $target->id)->where('receiver_id', $viewer->id))
        )->first(['sender_id', 'status']);

        if (! $row) {
            return 'none';
        }

        if ($row->status === 'accepted') {
            return 'accepted';
        }

        // A request they sent me is actionable ("Accept"); one I sent is not.
        return (int) $row->sender_id === (int) $viewer->id ? 'pending' : 'incoming';
    }

    /**
     * May $viewer see $target's aggregates? Owner always; public profiles
     * always; private profiles only for accepted friends.
     */
    public function canViewProfile(User $target, ?User $viewer): bool
    {
        if (! $target->hasPrivateProfile()) {
            return true;
        }

        if (! $viewer) {
            return false;
        }

        return $viewer->id === $target->id || $this->friendStatus($target, $viewer) === 'accepted';
    }

    /**
     * Collection snapshot tiles (Backlog / Completed / Wishlist / Favorites)
     * with a representative cover image for each bucket.
     */
    public function collectionSnapshot(User $user): array
    {
        $buckets = [
            ['status' => 'backlog', 'label' => 'Backlog', 'color' => '#60a5fa', 'favorite' => false],
            ['status' => 'completed', 'label' => 'Completed', 'color' => '#22c55e', 'favorite' => false],
            ['status' => 'wishlist', 'label' => 'Wishlist', 'color' => '#f472b6', 'favorite' => false],
            ['status' => 'favorites', 'label' => 'Favorites', 'color' => '#facc15', 'favorite' => true],
        ];

        return array_map(function ($b) use ($user) {
            $q = UserGame::where('user_id', $user->id)
                ->when($b['favorite'], fn ($q) => $q->where('is_favorite', true), fn ($q) => $q->where('status', $b['status']));

            $count = (clone $q)->count();
            $cover = (clone $q)->with('game:id,background_image')
                ->orderByDesc('updated_at')->first()?->game?->background_image;

            return [
                'status' => $b['status'],
                'label' => $b['label'],
                'color' => $b['color'],
                'count' => $count,
                'cover' => $cover,
            ];
        }, $buckets);
    }

    /**
     * The "Playing Now" rail — in-progress games with progress %.
     */
    public function playingNow(User $user, int $limit = 6): array
    {
        return UserGame::where('user_id', $user->id)
            ->where('status', 'playing')
            ->with(['game:id,slug,name,background_image,platform_names'])
            ->orderByRaw('COALESCE(last_played_at, updated_at) DESC')
            ->limit($limit)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'background_image' => $ug->game?->background_image,
                'platform_names' => $ug->game?->platform_names ?? [],
                'progress' => $ug->progress,
                'hours_played' => $ug->hours_played,
                // null when nothing measured it — the UI says "not tracked"
                // instead of showing a zero as if it were data
                'playtime_source' => $ug->playtime_source,
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values()
            ->all();
    }

    /**
     * User-curated showcase — games pinned to the profile (max 4, ordered).
     */
    public function showcase(User $user): array
    {
        return UserGame::where('user_id', $user->id)
            ->whereNotNull('showcase_order')
            ->with(['game:id,slug,name,background_image,platform_names'])
            ->orderBy('showcase_order')
            ->limit(4)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'background_image' => $ug->game?->background_image,
                'platform_names' => $ug->game?->platform_names ?? [],
                'progress' => $ug->progress,
                'hours_played' => $ug->hours_played,
                // null when nothing measured it — the UI says "not tracked"
                // instead of showing a zero as if it were data
                'playtime_source' => $ug->playtime_source,
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
        // Postgres fast path: aggregate in SQL instead of loading the whole
        // collection into PHP (a 500-game library was ~1000 array iterations).
        // unnest() must stay at the TOP level of a select list, so it lives in
        // a subquery and trim/grouping happen outside of it.
        if (DB::connection()->getDriverName() === 'pgsql') {
            $total = UserGame::where('user_id', $user->id)->count();

            $aggregate = function (string $column) use ($user, $top, $total) {
                $rows = DB::select("
                    SELECT trim(raw_name) AS name, COUNT(*) AS c
                    FROM (
                        SELECT unnest(games.{$column}) AS raw_name
                        FROM user_games
                        JOIN games ON games.id = user_games.game_id
                        WHERE user_games.user_id = ?
                    ) x
                    WHERE trim(raw_name) <> ''
                    GROUP BY trim(raw_name)
                    ORDER BY c DESC
                    LIMIT {$top}
                ", [$user->id]);

                return array_map(fn ($row) => [
                    'name' => $row->name,
                    'count' => (int) $row->c,
                    'percent' => $total > 0 ? (int) round(((int) $row->c / $total) * 100) : 0,
                ], $rows);
            };

            return [
                'platforms' => $aggregate('platform_names'),
                'genres' => $aggregate('genre_names'),
                'total' => $total,
            ];
        }

        return $this->platformsAndGenresPhp($user, $top);
    }

    /** In-PHP fallback for non-Postgres drivers (tests run on SQLite). */
    private function platformsAndGenresPhp(User $user, int $top): array
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
    public function gamerDna(User $user, ?array $pg = null): array
    {
        // Reuse an already-computed platforms/genres breakdown when the caller
        // has one (AuthController@show) instead of re-running the aggregation.
        $pg = $pg ?? $this->platformsAndGenres($user, 4);
        $pg = [
            'genres' => array_slice($pg['genres'], 0, 4),
            'platforms' => array_slice($pg['platforms'], 0, 4),
        ];

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

    /**
     * Reputation & Power data: current reputation, month-over-month delta,
     * community percentile, ranking tier/division, and monthly contribution.
     */
    public function reputation(User $user): array
    {
        $rep = (int) ($user->forum_reputation ?? 0);

        // Percentile — "Top X%" of the community by reputation. Cached per
        // reputation value (1h): previously this ran two full-table scans on
        // EVERY profile view.
        $percentile = Cache::remember("reputation.percentile.v1.{$rep}", 3600, function () use ($rep) {
            $total = User::count();
            $higher = User::where('forum_reputation', '>', $rep)->count();

            return $total > 0 ? max(1, (int) ceil((($higher + 1) / $total) * 100)) : 100;
        });

        // Community ranking tier + division.
        [$tierName, $tierColor, $division] = $this->rankingTier($rep);

        // Monthly contribution (current month-to-date).
        $weights = config('ranking.contribution_weights') ?: self::DEFAULT_WEIGHTS;
        $start = now()->startOfMonth();
        $posts = $user->posts()->where('created_at', '>=', $start)->count();
        $comments = $user->comments()->where('status', 'approved')->where('created_at', '>=', $start)->count();
        $threads = $user->threads()->where('created_at', '>=', $start)->count();
        $contribution = $posts * $weights['post'] + $comments * $weights['comment'] + $threads * $weights['thread'];

        // Deltas vs the last completed month's snapshot.
        $lastPeriod = now()->subMonth()->format('Y-m');
        $snap = ReputationSnapshot::where('user_id', $user->id)->where('period', $lastPeriod)->first();
        $repDelta = ($snap && $snap->reputation > 0) ? (int) round((($rep - $snap->reputation) / $snap->reputation) * 100) : null;
        $contribDelta = ($snap && $snap->contribution_points > 0) ? (int) round((($contribution - $snap->contribution_points) / $snap->contribution_points) * 100) : null;

        // Sparkline series — last 6 monthly snapshots + the current value.
        $history = ReputationSnapshot::where('user_id', $user->id)
            ->orderBy('period')
            ->limit(6)
            ->pluck('reputation')
            ->map(fn ($v) => (int) $v)
            ->push($rep)
            ->values()
            ->all();

        return [
            'reputation' => $rep,
            'reputation_delta_percent' => $repDelta,
            'percentile' => $percentile,
            'tier' => $tierName,
            'tier_color' => $tierColor,
            'division' => $division,
            'history' => $history,
            'monthly_contribution' => $contribution,
            'monthly_contribution_delta_percent' => $contribDelta,
        ];
    }

    /**
     * Resolve a reputation value to a tier name, color, and Roman division (III→I).
     *
     * @return array{0:string,1:string,2:string}
     */
    public function rankingTier(int $rep): array
    {
        $tiers = config('ranking.tiers') ?: self::DEFAULT_TIERS;
        $current = $tiers[0];
        $nextMin = null;

        foreach ($tiers as $i => $tier) {
            if ($rep >= $tier['min']) {
                $current = $tier;
                $nextMin = $tiers[$i + 1]['min'] ?? null;
            }
        }

        $band = $nextMin !== null ? ($nextMin - $current['min']) : max(1, $current['min']);
        $frac = $band > 0 ? ($rep - $current['min']) / $band : 1;
        $division = ['III', 'II', 'I'][min(2, max(0, (int) floor($frac * 3)))];

        return [$current['name'], $current['color'], $division];
    }

    /**
     * Top Recognitions — explicit awards from user_recognitions table.
     */
    public function recognitions(User $user, ?int $giverId = null): array
    {
        $counts = DB::table('user_recognitions')
            ->where('receiver_id', $user->id)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $givenByMe = [];
        if ($giverId && $giverId !== $user->id) {
            $givenByMe = DB::table('user_recognitions')
                ->where('giver_id', $giverId)
                ->where('receiver_id', $user->id)
                ->pluck('type')
                ->flip()
                ->map(fn () => true)
                ->all();
        }

        return [
            ['type' => 'helpful', 'label' => 'Helpful', 'count' => $counts['helpful'] ?? 0, 'given_by_me' => (bool) ($givenByMe['helpful'] ?? false)],
            ['type' => 'insightful', 'label' => 'Insightful', 'count' => $counts['insightful'] ?? 0, 'given_by_me' => (bool) ($givenByMe['insightful'] ?? false)],
            ['type' => 'friendly', 'label' => 'Friendly', 'count' => $counts['friendly'] ?? 0, 'given_by_me' => (bool) ($givenByMe['friendly'] ?? false)],
            ['type' => 'leader', 'label' => 'Leader', 'count' => $counts['leader'] ?? 0, 'given_by_me' => (bool) ($givenByMe['leader'] ?? false)],
        ];
    }

    /**
     * A user's public custom lists (preview with cover collage), for the
     * "Custom Lists" overview section.
     */
    public function publicLists(User $user, int $limit = 6): array
    {
        return GameList::where('user_id', $user->id)
            ->where('is_public', true)
            ->withCount('items')
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,background_image')])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (GameList $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'slug' => $l->slug,
                'items_count' => $l->items_count,
                'covers' => $l->items->map(fn ($it) => $it->game?->background_image)->filter()->take(4)->values()->all(),
            ])
            ->all();
    }

    /**
     * Loyalty & Customization: equipped cosmetics (applied to the profile) +
     * per-type owned/total summary. Public (read-only) data.
     */
    public function customization(User $user): array
    {
        $equippedRows = UserCustomization::where('user_id', $user->id)
            ->where('is_equipped', true)
            ->with('customization:id,name,type,value,asset')
            ->get();

        $equipped = ['theme' => null, 'frame' => null, 'badge' => null, 'post_color' => null];
        $perks = [];

        foreach ($equippedRows as $row) {
            $c = $row->customization;
            if (! $c) {
                continue;
            }
            if (array_key_exists($c->type, $equipped)) {
                $equipped[$c->type] = ['name' => $c->name, 'value' => $c->value, 'asset' => $c->asset];
            } elseif ($c->type === 'perk') {
                $perks[] = $c->slug;
            }
        }

        // Owned perks (equipped or not) — for unlocked check
        $ownedPerkSlugs = UserCustomization::where('user_id', $user->id)
            ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
            ->where('customizations.type', 'perk')
            ->pluck('customizations.slug')
            ->all();

        $totals = Customization::where('is_active', true)
            ->select('type', DB::raw('count(*) as c'))->groupBy('type')->pluck('c', 'type');
        $owned = UserCustomization::where('user_id', $user->id)
            ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
            ->select('customizations.type', DB::raw('count(*) as c'))->groupBy('customizations.type')->pluck('c', 'type');

        $labels = ['theme' => 'Profile Themes', 'frame' => 'Avatar Frames', 'badge' => 'Custom Badges', 'post_color' => 'Post Colors', 'perk' => 'Exclusive Perks'];
        $summary = [];
        foreach ($labels as $type => $label) {
            $summary[] = [
                'type' => $type,
                'label' => $label,
                'owned' => (int) ($owned[$type] ?? 0),
                'total' => (int) ($totals[$type] ?? 0),
            ];
        }

        return [
            'equipped' => $equipped,
            'perks' => [
                'active' => $perks,
                'animated_avatar' => in_array('animated-avatar', $ownedPerkSlugs, true),
                'profile_spotlight' => in_array('profile-spotlight', $ownedPerkSlugs, true),
            ],
            'summary' => $summary,
            'tier' => $user->loadMissing('activeSupport.tier')->activeSupport?->tier?->name,
        ];
    }

    /**
     * Contribution milestones — config-defined targets vs live metric values.
     *
     * @param  array<string,int>  $metrics  keyed by metric name (forum_posts, threads, wishlist, games, reputation)
     */
    public function milestones(array $metrics): array
    {
        return array_map(function (array $m) use ($metrics) {
            $current = (int) ($metrics[$m['metric']] ?? 0);
            $target = (int) $m['target'];
            $percent = $target > 0 ? min(100, (int) round(($current / $target) * 100)) : 0;

            return [
                'key' => $m['key'],
                'label' => $m['label'],
                'icon' => $m['icon'] ?? null,
                'current' => $current,
                'target' => $target,
                'percent' => $percent,
                'completed' => $current >= $target,
            ];
        }, config('milestones') ?: []);
    }
}
