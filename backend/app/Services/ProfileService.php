<?php

namespace App\Services;

use App\Models\Customization;
use App\Models\GameList;
use App\Models\ReputationSnapshot;
use App\Models\User;
use App\Models\UserCustomization;
use App\Models\UserGame;
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
        ['name' => 'Bronze', 'min' => 0, 'color' => '#CD7F32'],
        ['name' => 'Silver', 'min' => 2000, 'color' => '#C0C0C0'],
        ['name' => 'Gold', 'min' => 5000, 'color' => '#FFD700'],
        ['name' => 'Platinum', 'min' => 10000, 'color' => '#67E8F9'],
        ['name' => 'Diamond', 'min' => 20000, 'color' => '#60A5FA'],
        ['name' => 'Master', 'min' => 40000, 'color' => '#C084FC'],
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

    /**
     * Reputation & Power data: current reputation, month-over-month delta,
     * community percentile, ranking tier/division, and monthly contribution.
     */
    public function reputation(User $user): array
    {
        $rep = (int) ($user->forum_reputation ?? 0);

        // Percentile — "Top X%" of the community by reputation.
        $total = User::count();
        $higher = User::where('forum_reputation', '>', $rep)->count();
        $percentile = $total > 0 ? max(1, (int) ceil((($higher + 1) / $total) * 100)) : 100;

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

        return [
            'reputation' => $rep,
            'reputation_delta_percent' => $repDelta,
            'percentile' => $percentile,
            'tier' => $tierName,
            'tier_color' => $tierColor,
            'division' => $division,
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
     * Top Recognitions — derived from existing community signals.
     */
    public function recognitions(User $user): array
    {
        $helpful = DB::table('comment_likes')
            ->join('comments', 'comments.id', '=', 'comment_likes.comment_id')
            ->where('comments.user_id', $user->id)
            ->where('comment_likes.type', 'up')
            ->count();

        $insightful = DB::table('thread_upvotes')
            ->join('threads', 'threads.id', '=', 'thread_upvotes.thread_id')
            ->where('threads.author_id', $user->id)
            ->count();

        $friendly = DB::table('friendships')
            ->where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->count();

        $leader = $user->threads()->count();

        return [
            ['type' => 'helpful', 'label' => 'Helpful', 'count' => $helpful],
            ['type' => 'insightful', 'label' => 'Insightful', 'count' => $insightful],
            ['type' => 'friendly', 'label' => 'Friendly', 'count' => $friendly],
            ['type' => 'leader', 'label' => 'Leader', 'count' => $leader],
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

        $equipped = ['theme' => null, 'frame' => null, 'badge' => null];
        foreach ($equippedRows as $row) {
            $c = $row->customization;
            if ($c && array_key_exists($c->type, $equipped)) {
                $equipped[$c->type] = ['name' => $c->name, 'value' => $c->value, 'asset' => $c->asset];
            }
        }

        $totals = Customization::where('is_active', true)
            ->select('type', DB::raw('count(*) as c'))->groupBy('type')->pluck('c', 'type');
        $owned = UserCustomization::where('user_id', $user->id)
            ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
            ->select('customizations.type', DB::raw('count(*) as c'))->groupBy('customizations.type')->pluck('c', 'type');

        $labels = ['theme' => 'Profile Themes', 'frame' => 'Avatar Frames', 'badge' => 'Custom Badges', 'perk' => 'Exclusive Perks'];
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
            'summary' => $summary,
            'tier' => optional(optional($user->activeSupport()->with('tier')->first())->tier)->name,
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
