<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Season;
use App\Models\User;
use App\Services\LevelService;
use App\Traits\ApiResponse;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    use ApiResponse;

    private const LIMIT = 50;

    private const TTL = 300; // 5 min — fresh enough, cheap enough

    /**
     * Friends-only profiles opt out of every public ranking. The flag is
     * worthless if the board still publishes your name, avatar and XP.
     */
    private const PUBLIC_ONLY = "users.profile_visibility = 'public'";

    /**
     * Every board, and what it counts. Only the score boards carry a snapshot
     * baseline, so only those can be cut by period.
     */
    private const BOARDS = [
        'xp' => ['label' => 'XP', 'periodic' => true],
        'reputation' => ['label' => 'Reputation', 'periodic' => true],
        'collection' => ['label' => 'Games', 'periodic' => false],
        'completions' => ['label' => 'Completed', 'periodic' => false],
        'reviews' => ['label' => 'Reviews', 'periodic' => false],
        'achievements' => ['label' => 'Achievements', 'periodic' => false],
    ];

    /**
     * GET /leaderboard?type=…&period=all|month|week
     *
     * One call returns the board, the viewer's own standing, the season
     * countdown and the biggest movers — the page needs all four at once and
     * they share most of the same reads.
     */
    public function index(Request $request, LevelService $levels): JsonResponse
    {
        $type = (string) $request->query('type', 'xp');
        $period = (string) $request->query('period', 'all');

        if (! isset(self::BOARDS[$type])) {
            return $this->error('Invalid leaderboard type', 422);
        }

        if (! in_array($period, ['all', 'month', 'week'], true)) {
            return $this->error('Invalid leaderboard period', 422);
        }

        // Only the score boards have a baseline to measure a period against.
        if ($period !== 'all' && ! self::BOARDS[$type]['periodic']) {
            $period = 'all';
        }

        $viewerId = $request->user()?->id;

        $entries = Cache::remember(
            "leaderboard.v2.{$type}.{$period}.".$this->periodKey($period),
            self::TTL,
            fn () => $this->enrich($this->rank($type, $period), $type, $levels)
        );

        return $this->success([
            'entries' => $entries,
            'type' => $type,
            'period' => $period,
            'label' => self::BOARDS[$type]['label'],
            'periodic' => self::BOARDS[$type]['periodic'],
            'viewer' => $viewerId
                ? Cache::remember(
                    "leaderboard.v2.viewer.{$viewerId}.{$type}.{$period}",
                    60,
                    fn () => $this->viewer($type, $period, $levels)
                )
                : $this->viewer($type, $period, $levels),
            'season' => Cache::remember('leaderboard.v2.season', 300, fn () => $this->season()),
            'rising' => Cache::remember('leaderboard.v2.rising', self::TTL, fn () => $this->rising()),
        ]);
    }

    /* ── ranking ──────────────────────────────────────────────────────── */

    private function periodKey(string $period): string
    {
        return match ($period) {
            'week' => now()->format('o-\WW'),
            'month' => now()->format('Y-m'),
            default => 'all',
        };
    }

    /**
     * The baseline a delta is measured against. Weekly baselines are written
     * every Monday; the monthly job runs on the 1st and stamps the month that
     * just ended, so that row holds the value at this month's start.
     */
    private function baselineKey(string $period): string
    {
        return $period === 'week' ? now()->format('o-\WW') : now()->subMonth()->format('Y-m');
    }

    /**
     * Ordered [user_id => value] for the chosen board.
     *
     * @return array<int,int>
     */
    private function rank(string $type, string $period): array
    {
        if ($period !== 'all') {
            return $this->rankByDelta($type, $period);
        }

        return match ($type) {
            'xp' => $this->rankByColumn('xp'),
            'reputation' => $this->rankByColumn('forum_reputation'),
            'collection' => $this->rankByCount('user_games', null),
            'completions' => $this->rankByCount('user_games', fn ($q) => $q->where('status', 'completed')),
            'reviews' => $this->rankByCount('game_ratings', fn ($q) => $q->where('is_draft', false)->whereNotNull('review')),
            'achievements' => $this->rankByCount('user_achievements', null),
        };
    }

    /** @return array<int,int> */
    private function rankByColumn(string $column): array
    {
        return DB::table('users')
            ->whereRaw(self::PUBLIC_ONLY)
            ->where($column, '>', 0)
            ->orderByDesc($column)
            ->limit(self::LIMIT)
            ->pluck($column, 'id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    /**
     * Count rows in a related table per user.
     *
     * @return array<int,int>
     */
    private function rankByCount(string $table, ?callable $filter): array
    {
        return DB::table('users')
            ->joinSub($this->tally($table, $filter), 't', 'users.id', '=', 't.user_id')
            ->whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('t.tally')
            ->limit(self::LIMIT)
            ->pluck('t.tally', 'users.id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    /**
     * @param  null|callable(Builder):void  $filter
     */
    private function tally(string $table, ?callable $filter): Builder
    {
        $sub = DB::table($table)->selectRaw('user_id, COUNT(*) as tally')->groupBy('user_id');

        if ($filter) {
            $filter($sub);
        }

        return $sub;
    }

    /**
     * Rank by gain since the period's baseline snapshot. Users without a
     * baseline (they joined mid-period) count their whole score as the gain.
     *
     * @return array<int,int>
     */
    private function rankByDelta(string $type, string $period): array
    {
        $column = $type === 'xp' ? 'xp' : 'forum_reputation';
        $snapshotColumn = $type === 'xp' ? 'xp' : 'reputation';
        $key = $this->baselineKey($period);

        return DB::table('users')
            ->leftJoin('reputation_snapshots as s', function ($join) use ($key) {
                $join->on('s.user_id', '=', 'users.id')->where('s.period', '=', $key);
            })
            ->whereRaw(self::PUBLIC_ONLY)
            ->selectRaw("users.id, (COALESCE(users.{$column},0) - COALESCE(s.{$snapshotColumn},0)) as delta")
            ->orderByDesc('delta')
            ->limit(self::LIMIT)
            ->get()
            ->filter(fn ($r) => (int) $r->delta > 0)
            ->pluck('delta', 'id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    /* ── enrichment ───────────────────────────────────────────────────── */

    /**
     * Turn ranked ids into rows the table can draw — name, rank title, level,
     * games played, reputation and this week's movement — in a fixed number of
     * queries however many rows are on the board.
     */
    private function enrich(array $ranked, string $type, LevelService $levels): array
    {
        if ($ranked === []) {
            return [];
        }

        $ids = array_keys($ranked);

        $users = User::with('rank:id,name,color')
            ->whereIn('id', $ids)
            ->get(['id', 'username', 'display_name', 'avatar_url', 'xp', 'forum_reputation', 'rank_id', 'email_verified_at'])
            ->keyBy('id');

        $games = DB::table('user_games')->selectRaw('user_id, COUNT(*) as tally')
            ->whereIn('user_id', $ids)->groupBy('user_id')->pluck('tally', 'user_id');

        // Movement is always "since Monday", whatever the board ranks by.
        $baseline = DB::table('reputation_snapshots')
            ->where('period', now()->format('o-\WW'))
            ->whereIn('user_id', $ids)
            ->pluck('xp', 'user_id');

        $position = 0;

        return collect($ranked)->map(function (int $value, int $id) use (&$position, $users, $games, $baseline, $type, $levels) {
            $user = $users->get($id);

            if (! $user) {
                return null;
            }

            $position++;
            $snapshot = $baseline->get($id);

            return [
                'position' => $position,
                'username' => $user->username,
                'name' => $user->display_name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'rank_title' => $user->rank?->name,
                'rank_color' => $user->rank?->color,
                'verified' => $user->email_verified_at !== null,
                'level' => $levels->forXp($user->xp),
                'value' => $value,
                'label' => self::BOARDS[$type]['label'],
                'games' => (int) ($games[$id] ?? 0),
                'reputation' => (int) ($user->forum_reputation ?? 0),
                // null, not zero — "no baseline yet" and "hasn't moved" are
                // different, and the arrow should only appear for the second.
                'trend' => $snapshot === null ? null : (int) $user->xp - (int) $snapshot,
            ];
        })->filter()->values()->all();
    }

    /* ── the viewer ───────────────────────────────────────────────────── */

    /**
     * Where the signed-in user stands, even when they're nowhere near the top
     * fifty. Private profiles are told plainly that they opted out.
     */
    private function viewer(string $type, string $period, LevelService $levels): ?array
    {
        // Public route — a bearer token only resolves through sanctum.
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user) {
            return null;
        }

        if ($user->hasPrivateProfile()) {
            return ['ranked' => false, 'reason' => 'private'];
        }

        $value = $this->viewerValue($user, $type, $period);
        $snapshot = DB::table('reputation_snapshots')
            ->where('user_id', $user->id)->where('period', now()->format('o-\WW'))->value('xp');

        return [
            'ranked' => true,
            'username' => $user->username,
            'name' => $user->display_name ?? $user->username,
            'avatar_url' => $user->avatar_url,
            'rank_title' => $user->rank?->name,
            'position' => $value > 0 ? $this->positionOf($type, $period, $value) : null,
            'value' => $value,
            'label' => self::BOARDS[$type]['label'],
            'games' => DB::table('user_games')->where('user_id', $user->id)->count(),
            'xp' => (int) ($user->xp ?? 0),
            'level' => $levels->forXp($user->xp),
            'level_progress' => $levels->progress($user->xp),
            'trend' => $snapshot === null ? null : (int) $user->xp - (int) $snapshot,
        ];
    }

    private function viewerValue(User $user, string $type, string $period): int
    {
        if ($period !== 'all') {
            $column = $type === 'xp' ? 'xp' : 'forum_reputation';
            $snapshotColumn = $type === 'xp' ? 'xp' : 'reputation';
            $baseline = (int) DB::table('reputation_snapshots')
                ->where('user_id', $user->id)
                ->where('period', $this->baselineKey($period))
                ->value($snapshotColumn);

            return max(0, (int) ($user->{$column} ?? 0) - $baseline);
        }

        return match ($type) {
            'xp' => (int) ($user->xp ?? 0),
            'reputation' => (int) ($user->forum_reputation ?? 0),
            'collection' => DB::table('user_games')->where('user_id', $user->id)->count(),
            'completions' => DB::table('user_games')->where('user_id', $user->id)->where('status', 'completed')->count(),
            'reviews' => DB::table('game_ratings')->where('user_id', $user->id)
                ->where('is_draft', false)->whereNotNull('review')->count(),
            'achievements' => DB::table('user_achievements')->where('user_id', $user->id)->count(),
        };
    }

    /**
     * How many public users beat this score, plus one. Counted rather than
     * read off the page, so it stays correct past the top fifty.
     */
    private function positionOf(string $type, string $period, int $value): int
    {
        if ($period !== 'all') {
            $column = $type === 'xp' ? 'xp' : 'forum_reputation';
            $snapshotColumn = $type === 'xp' ? 'xp' : 'reputation';
            $key = $this->baselineKey($period);

            return 1 + DB::table('users')
                ->leftJoin('reputation_snapshots as s', function ($join) use ($key) {
                    $join->on('s.user_id', '=', 'users.id')->where('s.period', '=', $key);
                })
                ->whereRaw(self::PUBLIC_ONLY)
                ->whereRaw("(COALESCE(users.{$column},0) - COALESCE(s.{$snapshotColumn},0)) > ?", [$value])
                ->count();
        }

        return 1 + match ($type) {
            'xp' => DB::table('users')->whereRaw(self::PUBLIC_ONLY)->where('xp', '>', $value)->count(),
            'reputation' => DB::table('users')->whereRaw(self::PUBLIC_ONLY)->where('forum_reputation', '>', $value)->count(),
            'collection' => $this->countAbove('user_games', null, $value),
            'completions' => $this->countAbove('user_games', fn ($q) => $q->where('status', 'completed'), $value),
            'reviews' => $this->countAbove('game_ratings', fn ($q) => $q->where('is_draft', false)->whereNotNull('review'), $value),
            'achievements' => $this->countAbove('user_achievements', null, $value),
        };
    }

    private function countAbove(string $table, ?callable $filter, int $value): int
    {
        return DB::table('users')
            ->joinSub($this->tally($table, $filter), 't', 'users.id', '=', 't.user_id')
            ->whereRaw(self::PUBLIC_ONLY)
            ->where('t.tally', '>', $value)
            ->count();
    }

    /* ── side panels ──────────────────────────────────────────────────── */

    /**
     * Biggest XP gains since Monday. Deliberately not the same list as the top
     * of the board — that's the whole point of it.
     */
    private function rising(): array
    {
        $key = now()->format('o-\WW');

        return DB::table('users')
            ->join('reputation_snapshots as s', function ($join) use ($key) {
                $join->on('s.user_id', '=', 'users.id')->where('s.period', '=', $key);
            })
            ->whereRaw(self::PUBLIC_ONLY)
            ->selectRaw('users.username, users.display_name, users.avatar_url, users.xp, (users.xp - s.xp) as gain')
            ->orderByDesc('gain')
            ->limit(5)
            ->get()
            ->filter(fn ($r) => (int) $r->gain > 0)
            ->values()
            ->map(fn ($r, int $i) => [
                'position' => $i + 1,
                'username' => $r->username,
                'name' => $r->display_name ?? $r->username,
                'avatar_url' => $r->avatar_url,
                'gain' => (int) $r->gain,
                'xp' => (int) $r->xp,
            ])
            ->all();
    }

    /**
     * The running season, with the end date the page counts down to. Null when
     * no season is active — the panel disappears rather than inventing one.
     */
    private function season(): ?array
    {
        $season = Season::active();

        if (! $season) {
            return null;
        }

        $user = Auth::guard('sanctum')->user() ?? Auth::user();
        $seasonXp = null;

        if ($user && $season->start_date) {
            // XP earned since the season opened, measured off the monthly
            // baseline written at its start.
            $baseline = DB::table('reputation_snapshots')
                ->where('user_id', $user->id)
                ->where('period', $season->start_date->format('Y-m'))
                ->value('xp');

            $seasonXp = $baseline === null ? null : max(0, (int) ($user->xp ?? 0) - (int) $baseline);
        }

        return [
            'name' => $season->name,
            'description' => $season->description,
            'badge_image' => $season->badge_image,
            'starts_at' => $season->start_date?->toIso8601String(),
            'ends_at' => $season->end_date?->endOfDay()->toIso8601String(),
            'xp_multiplier' => (float) $season->xp_multiplier,
            'bounty_multiplier' => (float) $season->bounty_multiplier,
            'your_xp' => $seasonXp,
        ];
    }
}
