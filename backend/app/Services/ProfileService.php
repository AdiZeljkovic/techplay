<?php

namespace App\Services;

use App\Models\Customization;
use App\Models\Friendship;
use App\Models\GameList;
use App\Models\ReputationSnapshot;
use App\Models\User;
use App\Models\UserCustomization;
use App\Models\UserGame;
use Carbon\Carbon;
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
            // Played once, not playing now, and never claimed to be finished.
            'played_count' => (int) ($byStatus['played'] ?? 0),
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
            // Playing led the stats block and the hero deck but had no tile
            // here, so the one bucket a reader is most likely to click was the
            // one the shelf never offered.
            ['status' => 'playing', 'label' => 'Playing', 'color' => '#a78bfa', 'favorite' => false],
            ['status' => 'backlog', 'label' => 'Backlog', 'color' => '#60a5fa', 'favorite' => false],
            ['status' => 'completed', 'label' => 'Completed', 'color' => '#22c55e', 'favorite' => false],
            ['status' => 'wishlist', 'label' => 'Wishlist', 'color' => '#f472b6', 'favorite' => false],
            ['status' => 'favorites', 'label' => 'Favorites', 'color' => '#facc15', 'favorite' => true],
        ];

        return array_map(function ($b) use ($user) {
            $q = UserGame::where('user_id', $user->id)
                ->when($b['favorite'], fn ($q) => $q->where('is_favorite', true), fn ($q) => $q->where('status', $b['status']));

            $count = (clone $q)->count();
            $cover = (clone $q)->with('game:id,cover_url')
                ->orderByDesc('updated_at')->first()?->game?->cover_url;

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
            ->with(['game:id,slug,name,cover_url,platforms'])
            ->orderByRaw('COALESCE(last_played_at, updated_at) DESC')
            ->limit($limit)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'cover_url' => $ug->game?->cover_url,
                'platforms' => $ug->game?->platforms ?? [],
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
            ->with(['game:id,slug,name,cover_url,platforms'])
            ->orderBy('showcase_order')
            ->limit(4)
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game?->slug,
                'name' => $ug->game?->name,
                'cover_url' => $ug->game?->cover_url,
                'platforms' => $ug->game?->platforms ?? [],
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

            $aggregate = function (string $column) use ($user, $top) {
                // The share is of the distribution, not of the shelf. Dividing
                // by the number of games made the bars add up to 125% on a
                // four-game collection, because one game carries several
                // genres — every row was true and the column was nonsense.
                // SUM(COUNT(*)) OVER () totals every name, including the ones
                // past the top N, so the visible bars stay a fair slice of the
                // whole.
                $rows = DB::select("
                    SELECT name, c, SUM(c) OVER () AS mentions
                    FROM (
                        SELECT trim(raw_name) AS name, COUNT(*) AS c
                        FROM (
                            SELECT unnest(games.{$column}) AS raw_name
                            FROM user_games
                            JOIN games ON games.id = user_games.game_id
                            WHERE user_games.user_id = ?
                        ) x
                        WHERE trim(raw_name) <> ''
                        GROUP BY trim(raw_name)
                    ) counted
                    ORDER BY c DESC
                    LIMIT {$top}
                ", [$user->id]);

                $mentions = (int) ($rows[0]->mentions ?? 0);

                return array_map(fn ($row) => [
                    'name' => $row->name,
                    'count' => (int) $row->c,
                    'percent' => $mentions > 0 ? (int) round(((int) $row->c / $mentions) * 100) : 0,
                ], $rows);
            };

            return [
                'platforms' => $aggregate('platforms'),
                'genres' => $aggregate('genres'),
                'total' => $total,
            ];
        }

        return $this->platformsAndGenresPhp($user, $top);
    }

    /** In-PHP fallback for non-Postgres drivers (tests run on SQLite). */
    private function platformsAndGenresPhp(User $user, int $top): array
    {
        $games = UserGame::where('user_id', $user->id)
            ->with(['game:id,platforms,genres'])
            ->get()
            ->map(fn (UserGame $ug) => $ug->game)
            ->filter();

        $total = $games->count();
        $platforms = [];
        $genres = [];

        foreach ($games as $game) {
            foreach (($game->platforms ?? []) as $p) {
                $p = trim((string) $p);
                if ($p !== '') {
                    $platforms[$p] = ($platforms[$p] ?? 0) + 1;
                }
            }
            foreach (($game->genres ?? []) as $g) {
                $g = trim((string) $g);
                if ($g !== '') {
                    $genres[$g] = ($genres[$g] ?? 0) + 1;
                }
            }
        }

        // Same denominator as the Postgres path: every mention, not every game.
        $format = function (array $counts) use ($top) {
            $mentions = array_sum($counts);
            arsort($counts);
            $counts = array_slice($counts, 0, $top, true);
            $out = [];
            foreach ($counts as $name => $count) {
                $out[] = [
                    'name' => $name,
                    'count' => $count,
                    'percent' => $mentions > 0 ? (int) round(($count / $mentions) * 100) : 0,
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
     * The player card — how serious this person is, in four numbers.
     *
     * A visitor arrives asking one question the counters never answered: is
     * this a shelf somebody filled once, or years of playing? Hours, the span
     * they cover, the one game that took the largest share of them, and what
     * the platforms certified. The status counts already on the page say what
     * is owned; none of them says what was *played*.
     *
     * Aggregates only. The same figures exist on the Gamer DNA tab, but that
     * page loads the whole shelf to derive them — 191 rows with their games —
     * and this ships on every public profile view, so it asks the database for
     * sums instead of rows. Years come back as timestamps and are formatted in
     * PHP: `extract(year from ...)` is Postgres-only and the suite is SQLite.
     *
     * @return array{hours:int,games_played:int,span:?array{from:int,to:int},deepest:?array,achievements:?array}
     */
    public function playerCard(User $user): array
    {
        $play = UserGame::where('user_id', $user->id)
            ->where('playtime_minutes', '>', 0)
            ->selectRaw('coalesce(sum(playtime_minutes), 0) as minutes, count(*) as games')
            ->first();

        $minutes = (int) ($play->minutes ?? 0);

        $span = UserGame::where('user_id', $user->id)
            ->whereNotNull('last_played_at')
            ->selectRaw('min(last_played_at) as first_at, max(last_played_at) as last_at')
            ->first();

        $deepest = $minutes === 0 ? null : UserGame::where('user_id', $user->id)
            ->where('playtime_minutes', '>', 0)
            ->with(['game:id,slug,name,cover_url'])
            ->orderByDesc('playtime_minutes')
            ->first();

        // Steam is the only source that certifies anything today; PSN and Xbox
        // land in the same table when they arrive, so the key is neutral.
        $ach = DB::table('steam_achievements')
            ->where('user_id', $user->id)
            ->selectRaw('count(*) as total_count, sum(case when achieved then 1 else 0 end) as earned_count')
            ->first();

        $total = (int) ($ach->total_count ?? 0);
        $earned = (int) ($ach->earned_count ?? 0);

        return [
            'hours' => (int) round($minutes / 60),
            'games_played' => (int) ($play->games ?? 0),
            'span' => $span?->first_at ? [
                'from' => (int) Carbon::parse($span->first_at)->format('Y'),
                'to' => (int) Carbon::parse($span->last_at)->format('Y'),
            ] : null,
            'deepest' => $deepest?->game ? [
                'slug' => $deepest->game->slug,
                'name' => $deepest->game->name,
                'cover_url' => $deepest->game->cover_url,
                'hours' => (int) round((int) $deepest->playtime_minutes / 60),
                // What share of a whole shelf's hours one game took.
                'share' => (int) round((int) $deepest->playtime_minutes / $minutes * 100),
            ] : null,
            // Null rather than zeroes: nobody has connected a platform, which
            // is a different statement from having earned nothing.
            'achievements' => $total === 0 ? null : [
                'total' => $total,
                'earned' => $earned,
                'rate' => (int) round($earned / $total * 100),
            ],
        ];
    }

    /**
     * Where this player stands, on the one ladder the site actually has.
     *
     * This block used to run a ladder of its own: six Community Standing tiers
     * split into three divisions each, driven by `forum_reputation`. Two
     * things were wrong with it, and both were measurable.
     *
     * It was calibrated for a community thirty times this one. The first
     * promotion sat at 2,000 reputation; reputation moves by ±1 per forum vote
     * and +10 per accepted solution, and the site record is 68 across 53
     * accounts, two of which have any at all. Every profile read
     * "Rookie III · Top 100% of the community" — a ladder nobody had climbed
     * a single rung of, and could not.
     *
     * And four of its six names — Rookie, Veteran, Elite, Legend — are also XP
     * rank names, so a reader saw "Noob" in the hero and "Rookie III" in the
     * sidebar and reasonably concluded something was broken. Nothing was; they
     * were two ladders wearing each other's words.
     *
     * So the card shows the XP rank, which is the ladder that moves: XP is
     * awarded for comments, games added, games completed, reviews and Discord
     * messages, and ten accounts have some. Reputation stays in the payload
     * because it is real and the leaderboard ranks by it — it is simply no
     * longer dressed as a rank.
     */
    public function reputation(User $user): array
    {
        $rep = (int) ($user->forum_reputation ?? 0);
        $xp = (int) ($user->xp ?? 0);

        // Percentile — "Top X%" of the community, by the ladder on display.
        // Cached per XP value (1h): this is two full-table scans, and it runs
        // on every profile view.
        $percentile = Cache::remember("standing.percentile.v1.{$xp}", 3600, function () use ($xp) {
            $total = User::count();
            $higher = User::where('xp', '>', $xp)->count();

            return $total > 0 ? max(1, (int) ceil((($higher + 1) / $total) * 100)) : 100;
        });

        $rank = $user->loadMissing('rank')->rank;

        // The next band up, for the rail beneath the insignia. Null at the top
        // of the ladder, where there is nothing left to fill toward.
        //
        // The model's own method, not a second query shaped like it: the hero
        // calls this one, and two definitions of "next rank" on one screen is
        // how they end up disagreeing. It keys off xp rather than off the
        // current rank's floor, so a stale `rank_id` cannot strand a reader.
        $nextRank = $user->nextRank();

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
        $xpDelta = ($snap && $snap->xp > 0) ? (int) round((($xp - $snap->xp) / $snap->xp) * 100) : null;
        $contribDelta = ($snap && $snap->contribution_points > 0) ? (int) round((($contribution - $snap->contribution_points) / $snap->contribution_points) * 100) : null;

        // Sparkline series — last 6 monthly snapshots + the current value.
        //
        // Two corrections live in this query. It sorted ascending and took six,
        // which is the *oldest* six, so the line would have frozen on early
        // 2026 the moment a seventh month existed. And the weekly leaderboard
        // baseline writes to this same table with a period like `2026-W32`,
        // which sorts after `2026-08` as a string — so the series was mixing
        // two cadences. Months only, newest six, then back into reading order.
        //
        // It plots XP now, not reputation: the line has to be the same
        // quantity as the figure above it. `xp` has been snapshotted weekly and
        // monthly since July, so the series has real history from day one.
        $history = ReputationSnapshot::where('user_id', $user->id)
            ->where('period', 'not like', '%W%')
            ->orderByDesc('period')
            ->limit(6)
            ->pluck('xp')
            ->reverse()
            ->map(fn ($v) => (int) $v)
            ->push($xp)
            ->values()
            ->all();

        return [
            // The ladder on display: the same rank the hero draws, because
            // there is only one.
            'rank' => $rank ? [
                'name' => $rank->name,
                'color' => $rank->color,
                'icon' => $rank->icon,
                'min_xp' => (int) $rank->min_xp,
            ] : null,
            'next_rank' => $nextRank ? [
                'name' => $nextRank->name,
                'min_xp' => (int) $nextRank->min_xp,
            ] : null,
            'xp' => $xp,
            'xp_delta_percent' => $xpDelta,
            'percentile' => $percentile,
            'history' => $history,
            'monthly_contribution' => $contribution,
            'monthly_contribution_delta_percent' => $contribDelta,
            // Kept, no longer a ladder. The leaderboard still ranks by it.
            'reputation' => $rep,
            'reputation_delta_percent' => $repDelta,
        ];
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
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,cover_url')])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (GameList $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'slug' => $l->slug,
                'items_count' => $l->items_count,
                'covers' => $l->items->map(fn ($it) => $it->game?->cover_url)->filter()->take(4)->values()->all(),
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
