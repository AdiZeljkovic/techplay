<?php

namespace App\Services;

use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\User;
use App\Notifications\QuestCompletedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Central engine for quest progress tracking.
 * Call QuestService::progress($user, $criteriaType, $increment) from any trigger
 * (game completed, article published, streak, comment, etc.).
 */
class QuestService
{
    public function __construct(
        protected BountyService $bountyService,
        protected XpService $xpService,
    ) {}

    /**
     * Increment progress for all active quests matching the criteria type.
     * Awards rewards and fires notifications on completion.
     */
    public function progress(User $user, string $criteriaType, int $increment = 1): void
    {
        try {
            $quests = Quest::where('is_active', true)
                ->where('criteria_type', $criteriaType)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->get();

            foreach ($quests as $quest) {
                $this->progressQuest($user, $quest, $increment);
            }
        } catch (\Throwable $e) {
            Log::warning('QuestService::progress failed', [
                'user_id' => $user->id,
                'criteria_type' => $criteriaType,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function progressQuest(User $user, Quest $quest, int $increment): void
    {
        DB::transaction(function () use ($user, $quest, $increment) {
            $entry = QuestProgress::firstOrCreate(
                ['user_id' => $user->id, 'quest_id' => $quest->id],
                ['progress' => 0, 'completed_at' => null]
            );

            // Already completed — skip (daily/weekly quests can reset, permanent ones cannot)
            if ($entry->completed_at !== null) {
                if ($quest->type === 'permanent') {
                    return;
                }
                // Reset if the completion is from a previous period
                if (! $this->isInCurrentPeriod($quest, $entry->completed_at)) {
                    $entry->progress = 0;
                    $entry->completed_at = null;
                } else {
                    return;
                }
            }

            $entry->progress = min($entry->progress + $increment, $quest->criteria_value);
            $entry->save();

            if ($entry->progress >= $quest->criteria_value) {
                $entry->completed_at = now();
                $entry->save();
                $this->grantRewards($user, $quest);
            }
        });
    }

    private function grantRewards(User $user, Quest $quest): void
    {
        if ($quest->xp_reward > 0) {
            // Single XP path: daily cap, bounty mirror, season multiplier, rank check
            $this->xpService->awardXp($user, $quest->xp_reward, 'quest');
        }

        if ($quest->bounty_reward > 0) {
            $this->bountyService->award($user, $quest->bounty_reward, "Quest completed: {$quest->name}", 'quest');
        }

        try {
            $user->notify(new QuestCompletedNotification($quest));
        } catch (\Throwable) {
        }
    }

    private function isInCurrentPeriod(Quest $quest, Carbon $completedAt): bool
    {
        return match ($quest->type) {
            'daily' => $completedAt->isToday(),
            'weekly' => $completedAt->isCurrentWeek(),
            'monthly' => $completedAt->isCurrentMonth(),
            default => true,
        };
    }
}
