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
     * GET /leaderboard?type=xp|reputation|collection|completions
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'xp');

        if (! in_array($type, ['xp', 'reputation', 'collection', 'completions'])) {
            return $this->error('Invalid leaderboard type', 422);
        }

        $data = Cache::remember("leaderboard:{$type}", self::TTL, fn () => $this->build($type));

        return $this->success($data);
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
        return User::orderByDesc('forum_reputation')
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
