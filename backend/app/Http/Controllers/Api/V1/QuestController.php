<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\Season;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class QuestController extends Controller
{
    use ApiResponse;

    /**
     * GET /user/quests — active quests with current user's progress.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $quests = Quest::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            // Show global quests + the active season's quests only
            ->where(function ($q) {
                $q->whereNull('season_id')->orWhere('season_id', Season::activeId());
            })
            ->orderByRaw("CASE WHEN season_id IS NOT NULL THEN 0 ELSE 1 END, CASE type WHEN 'daily' THEN 0 WHEN 'weekly' THEN 1 WHEN 'monthly' THEN 2 ELSE 3 END")
            ->get();

        $progressMap = QuestProgress::where('user_id', $userId)
            ->whereIn('quest_id', $quests->pluck('id'))
            ->get()
            ->keyBy('quest_id');

        $result = $quests->map(function (Quest $quest) use ($progressMap) {
            $entry = $progressMap->get($quest->id);

            $completed = false;
            if ($entry?->completed_at) {
                $completed = match ($quest->type) {
                    'daily' => $entry->completed_at->isToday(),
                    'weekly' => $entry->completed_at->isCurrentWeek(),
                    'monthly' => $entry->completed_at->isCurrentMonth(),
                    default => true,
                };
            }

            $progress = $completed ? $quest->criteria_value : (int) ($entry?->progress ?? 0);

            return [
                'id' => $quest->id,
                'name' => $quest->name,
                'description' => $quest->description,
                'icon' => $quest->icon,
                'type' => $quest->type,
                'criteria_value' => $quest->criteria_value,
                'xp_reward' => $quest->xp_reward,
                'bounty_reward' => $quest->bounty_reward,
                'progress' => $progress,
                'completed' => $completed,
                'is_seasonal' => $quest->season_id !== null,
                'expires_at' => $quest->expires_at?->toIso8601String(),
            ];
        });

        return $this->success($this->shortlist($result, (int) $userId));
    }

    /**
     * How many of each layer a reader is shown at once.
     *
     * The catalogue is deliberately larger than the board. Twenty-three open
     * quests is a list to scroll past, not a set of things to do — and the
     * point of a daily is that it is small enough to finish today.
     */
    private const SHOWN = ['daily' => 3, 'weekly' => 3, 'monthly' => 5, 'permanent' => 5];

    /**
     * Trim each layer, and rotate the ones that repeat.
     *
     * The rotation is deterministic per reader and per period: the same three
     * dailies all day, a different three tomorrow, and not the same three as
     * everybody else. Seeding it on the period means no state to store and no
     * job to run — the day is the shuffle.
     *
     * Completed onboarding quests drop off. A permanent quest never resets, so
     * leaving it on the board turns a five-step welcome into five ticks that
     * follow you around forever.
     */
    private function shortlist(Collection $quests, int $userId): array
    {
        $seeds = [
            'daily' => now()->toDateString(),
            'weekly' => now()->format('o-\WW'),
            'monthly' => now()->format('Y-m'),
            'permanent' => 'fixed',
        ];

        return $quests
            ->reject(fn (array $q) => $q['type'] === 'permanent' && $q['completed'])
            ->groupBy('type')
            ->flatMap(function (Collection $group, string $type) use ($seeds, $userId) {
                // Seasonal quests are the season's arc — they are not rotated
                // away, and they lead.
                [$seasonal, $rest] = $group->partition(fn (array $q) => $q['is_seasonal']);

                $period = $seeds[$type] ?? 'fixed';

                $picked = $rest
                    ->sortBy(fn (array $q) => md5($q['id'].'|'.$period.'|'.$userId))
                    // Anything already finished this period stays visible, so
                    // the board shows the day's work rather than hiding the
                    // part that went well.
                    ->sortByDesc(fn (array $q) => $q['completed'] ? 0 : 1)
                    ->take(self::SHOWN[$type] ?? 3);

                return $seasonal->concat($picked);
            })
            ->sortBy(fn (array $q) => match ($q['type']) {
                'permanent' => 0,
                'daily' => 1,
                'weekly' => 2,
                default => 3,
            })
            ->values()
            ->all();
    }
}
