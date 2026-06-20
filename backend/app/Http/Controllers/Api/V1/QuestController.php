<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Quest;
use App\Models\QuestProgress;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            ->orderByRaw("CASE type WHEN 'daily' THEN 0 WHEN 'weekly' THEN 1 WHEN 'monthly' THEN 2 ELSE 3 END")
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
                'expires_at' => $quest->expires_at?->toIso8601String(),
            ];
        });

        return $this->success($result);
    }
}
