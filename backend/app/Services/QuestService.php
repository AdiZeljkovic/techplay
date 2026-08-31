<?php

namespace App\Services;

use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\Season;
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
                // Seasonal quests only progress while their season is active
                ->where(function ($q) {
                    $q->whereNull('season_id')->orWhere('season_id', Season::activeId());
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
            QuestProgress::firstOrCreate(
                ['user_id' => $user->id, 'quest_id' => $quest->id],
                ['progress' => 0, 'completed_at' => null]
            );

            // Re-read under a row lock. The transaction alone did not stop two
            // concurrent calls from reading the same progress, both crossing
            // the threshold, and both paying out — a quest worth XP and bounty
            // could be completed twice by firing the triggering action twice.
            $entry = QuestProgress::where('user_id', $user->id)
                ->where('quest_id', $quest->id)
                ->lockForUpdate()
                ->first();

            if (! $entry) {
                return;
            }

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
            /*
             * Outside the daily cap, and only quests are.
             *
             * The hundred-a-day ceiling stops somebody farming comments and
             * shelf additions all afternoon. A quest cannot be farmed: it pays
             * once per day, week, month, or once ever, and `isInCurrentPeriod()`
             * is what limits it. Inside the cap, every reward this catalogue
             * advertises was a half-truth — a 600 XP quest paid whatever was
             * left of a hundred and dropped the rest without saying so.
             *
             * Still through awardXp for the season multiplier, the ledger entry
             * and the rank check.
             */
            $this->xpService->awardXp($user, $quest->xp_reward, 'quest', respectDailyCap: false);
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
