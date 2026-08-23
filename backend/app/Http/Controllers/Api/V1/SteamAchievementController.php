<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\SteamAchievement;
use App\Models\User;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SteamAchievementController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * GET /users/{username}/steam-achievements
     *
     * Platform unlocks, filtered and paged the way our own achievements are.
     *
     * This used to answer with the hundred most recent unlocks and nothing
     * else: no paging, no search, and `where('achieved', true)` baked in — so
     * of 5,177 rows on a real account, 100 were reachable and the 4,240 still
     * locked could not be looked at at all. The panel that drew them had no
     * controls either, because there was nothing to control.
     */
    public function index(Request $request, string $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $status = $request->query('status', 'unlocked');
        $search = trim((string) $request->query('q', ''));
        $gameId = (int) $request->query('game', 0);
        $perPage = min(60, max(12, (int) $request->query('per_page', 24)));

        $base = fn () => SteamAchievement::where('user_id', $user->id);

        $query = $base()
            ->when($status === 'unlocked', fn ($q) => $q->where('achieved', true))
            ->when($status === 'locked', fn ($q) => $q->where('achieved', false))
            ->when($gameId > 0, fn ($q) => $q->where('game_id', $gameId))
            // `ilike` is Postgres's; the suite runs on SQLite, where `like` is
            // already case-insensitive. Spelling it either way keeps the search
            // testable instead of skipped.
            ->when($search !== '', function ($q) use ($search) {
                $op = $q->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

                $q->where(function ($w) use ($search, $op) {
                    $w->where('display_name', $op, "%{$search}%")
                        ->orWhere('description', $op, "%{$search}%");
                });
            })
            ->with('game:id,name,slug,cover_url')
            // Unlocked first and most recent first within them; a locked row
            // has no date and would otherwise lead, since Postgres sorts nulls
            // to the front of a descending order.
            ->orderByDesc('achieved')
            // `nulls last` is Postgres's spelling; SQLite orders nulls last on
            // a descending sort already, and rejects the clause outright.
            ->when(
                DB::connection()->getDriverName() === 'pgsql',
                fn ($q) => $q->orderByRaw('achieved_at desc nulls last'),
                fn ($q) => $q->orderByDesc('achieved_at'),
            )
            ->orderBy('display_name');

        $page = $query->paginate($perPage, ['id', 'game_id', 'steam_appid', 'display_name', 'description', 'icon_url', 'achieved', 'achieved_at']);

        $total = $base()->count();
        $achieved = $base()->where('achieved', true)->count();

        return $this->success([
            'total' => $total,
            'achieved' => $achieved,
            'locked' => $total - $achieved,
            'completion_pct' => $total > 0 ? (int) round(($achieved / $total) * 100) : 0,
            'games' => $this->games($user->id),
            'items' => $page->items(),
            'meta' => [
                'page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /**
     * The games these came from, so the list can be narrowed to one.
     *
     * Grouped in one query rather than one per game — 86 games on a real
     * account, and this panel is drawn on every visit to the tab.
     */
    private function games(int $userId): array
    {
        // Aliased away from `achieved`: the model casts that column to a
        // boolean, so a sum landing under the same name came back as `true`
        // and read as 1 however many were counted.
        $rows = SteamAchievement::where('user_id', $userId)
            ->whereNotNull('game_id')
            ->selectRaw('game_id, count(*) as total_count, sum(case when achieved then 1 else 0 end) as achieved_count')
            ->groupBy('game_id')
            ->orderByDesc('achieved_count')
            ->get();

        $names = Game::whereIn('id', $rows->pluck('game_id'))->pluck('name', 'id');

        return $rows
            ->filter(fn ($r) => isset($names[$r->game_id]))
            ->map(fn ($r) => [
                'id' => (int) $r->game_id,
                'name' => $names[$r->game_id],
                'total' => (int) $r->total_count,
                'achieved' => (int) $r->achieved_count,
            ])
            ->values()
            ->all();
    }
}
