<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
    private const PUBLIC_ONLY = "COALESCE(users.profile_visibility, 'public') = 'public'";

    /**
     * GET /leaderboard?type=xp|reputation|collection|completions&period=all|week
     * period=week ranks by delta since Monday's snapshot (xp/reputation only).
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'xp');
        $period = $request->query('period', 'all');

        if (! in_array($type, ['xp', 'reputation', 'collection', 'completions'])) {
            return $this->error('Invalid leaderboard type', 422);
        }

        if (! in_array($period, ['all', 'week'])) {
            return $this->error('Invalid leaderboard period', 422);
        }

        // Weekly cut only exists for the score-based boards
        if ($period === 'week' && ! in_array($type, ['xp', 'reputation'])) {
            $period = 'all';
        }

        $weekKey = now()->format('o-\WW');
        $cacheKey = $period === 'week' ? "leaderboard:{$type}:week:{$weekKey}" : "leaderboard:{$type}";

        $data = Cache::remember($cacheKey, self::TTL, fn () => $period === 'week'
            ? $this->buildWeekly($type, $weekKey)
            : $this->build($type));

        return $this->success($data);
    }

    /**
     * Rank by gain since the start-of-week baseline snapshot. Users without
     * a baseline (joined mid-week) count their full score as this week's gain.
     */
    private function buildWeekly(string $type, string $weekKey): array
    {
        $column = $type === 'xp' ? 'xp' : 'forum_reputation';
        $snapshotColumn = $type === 'xp' ? 'xp' : 'reputation';
        $label = $type === 'xp' ? 'XP this week' : 'Rep this week';

        $rows = DB::table('users')
            ->leftJoin('reputation_snapshots as s', function ($join) use ($weekKey) {
                $join->on('s.user_id', '=', 'users.id')->where('s.period', '=', $weekKey);
            })
            ->selectRaw("users.id, users.username, users.display_name, users.avatar_url, (COALESCE(users.{$column},0) - COALESCE(s.{$snapshotColumn},0)) as delta")
            ->whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('delta')
            ->limit(self::LIMIT)
            ->get();

        return $rows->filter(fn ($r) => (int) $r->delta > 0)->values()->map(fn ($r, int $i) => [
            'position' => $i + 1,
            'username' => $r->username,
            'name' => $r->display_name ?? $r->username,
            'avatar_url' => $r->avatar_url,
            'rank_title' => null,
            'value' => (int) $r->delta,
            'label' => $label,
        ])->all();
    }

    private function build(string $type): array
    {
        return match ($type) {
            'xp' => $this->buildXp(),
            'reputation' => $this->buildReputation(),
            'collection' => $this->buildCollection(),
            'completions' => $this->buildCompletions(),
        };
    }

    private function buildXp(): array
    {
        return User::with('rank')
            ->whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('xp')
            ->limit(self::LIMIT)
            ->get(['id', 'username', 'display_name', 'avatar_url', 'xp', 'rank_id'])
            ->values()
            ->map(fn (User $u, int $i) => [
                'position' => $i + 1,
                'username' => $u->username,
                'name' => $u->display_name ?? $u->username,
                'avatar_url' => $u->avatar_url,
                'rank_title' => $u->rank?->name ?? 'Newbie',
                'value' => (int) $u->xp,
                'label' => 'XP',
            ])
            ->all();
    }

    private function buildReputation(): array
    {
        return User::whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('forum_reputation')
            ->limit(self::LIMIT)
            ->get(['id', 'username', 'display_name', 'avatar_url', 'forum_reputation'])
            ->values()
            ->map(fn (User $u, int $i) => [
                'position' => $i + 1,
                'username' => $u->username,
                'name' => $u->display_name ?? $u->username,
                'avatar_url' => $u->avatar_url,
                'rank_title' => null,
                'value' => (int) $u->forum_reputation,
                'label' => 'Reputation',
            ])
            ->all();
    }

    private function buildCollection(): array
    {
        $rows = DB::table('users')
            ->join(
                DB::raw('(SELECT user_id, COUNT(*) as games_count FROM user_games GROUP BY user_id) as ug'),
                'users.id',
                '=',
                'ug.user_id'
            )
            ->whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('ug.games_count')
            ->limit(self::LIMIT)
            ->get(['users.id', 'users.username', 'users.display_name', 'users.avatar_url', 'ug.games_count']);

        return $rows->values()->map(fn ($r, int $i) => [
            'position' => $i + 1,
            'username' => $r->username,
            'name' => $r->display_name ?? $r->username,
            'avatar_url' => $r->avatar_url,
            'rank_title' => null,
            'value' => (int) $r->games_count,
            'label' => 'Games',
        ])->all();
    }

    private function buildCompletions(): array
    {
        $rows = DB::table('users')
            ->join(
                DB::raw("(SELECT user_id, COUNT(*) as completed_count FROM user_games WHERE status = 'completed' GROUP BY user_id) as ug"),
                'users.id',
                '=',
                'ug.user_id'
            )
            ->whereRaw(self::PUBLIC_ONLY)
            ->orderByDesc('ug.completed_count')
            ->limit(self::LIMIT)
            ->get(['users.id', 'users.username', 'users.display_name', 'users.avatar_url', 'ug.completed_count']);

        return $rows->values()->map(fn ($r, int $i) => [
            'position' => $i + 1,
            'username' => $r->username,
            'name' => $r->display_name ?? $r->username,
            'avatar_url' => $r->avatar_url,
            'rank_title' => null,
            'value' => (int) $r->completed_count,
            'label' => 'Completed',
        ])->all();
    }
}
