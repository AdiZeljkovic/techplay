<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class StreakService
{
    // Bounty awarded per day. Each consecutive day adds a +5 bonus (capped at 50).
    private const BASE_BOUNTY = 10;

    private const STREAK_BONUS_PER_DAY = 5;

    private const MAX_STREAK_BONUS = 50;

    public function __construct(
        protected BountyService $bountyService,
        protected QuestService $questService,
    ) {}

    /**
     * Claim the daily streak reward. Idempotent — safe to call multiple times per day.
     * Returns the result array or null if already claimed today.
     */
    public function claim(User $user): ?array
    {
        return DB::transaction(function () use ($user) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->first();

            // Already claimed today
            if ($fresh->last_daily_claim && $fresh->last_daily_claim->isToday()) {
                return null;
            }

            // Streak broken if last claim was more than 1 day ago
            $yesterday = now()->subDay()->startOfDay();
            $streakBroken = ! $fresh->last_daily_claim
                || $fresh->last_daily_claim->startOfDay()->lt($yesterday);

            $streak = $streakBroken ? 1 : $fresh->daily_streak + 1;

            $fresh->daily_streak = $streak;
            $fresh->last_daily_claim = now();
            // Total distinct active days — scored separately from the unbroken
            // streak, so breaking a streak never costs accumulated days.
            $fresh->active_days_count = (int) ($fresh->active_days_count ?? 0) + 1;
            $fresh->save();

            $user->daily_streak = $streak;
            $user->last_daily_claim = $fresh->last_daily_claim;
            $user->active_days_count = $fresh->active_days_count;

            // Award bounty: base + streak bonus
            $bonus = min(($streak - 1) * self::STREAK_BONUS_PER_DAY, self::MAX_STREAK_BONUS);
            $bounty = self::BASE_BOUNTY + $bonus;
            $balance = $this->bountyService->award($fresh, $bounty, "Daily streak day {$streak}", 'streak');

            // Fire quest progress
            $this->questService->progress($fresh, 'streak_days', 1);
            $this->questService->progress($fresh, 'daily_login', 1);

            // Streak and active-day trophies had no trigger before this
            try {
                app(AchievementService::class)->check($fresh, ['daily_streak', 'active_days']);
            } catch (\Throwable) {
            }

            return [
                'streak' => $streak,
                'bounty_earned' => $bounty,
                'bounty_balance' => $balance,
                'streak_broken' => $streakBroken && $fresh->daily_streak === 1,
            ];
        });
    }

    public function info(User $user): array
    {
        return [
            'streak' => $user->daily_streak ?? 0,
            'claimed_today' => $user->last_daily_claim && $user->last_daily_claim->isToday(),
            'last_claim' => $user->last_daily_claim?->toIso8601String(),
            'next_bounty' => self::BASE_BOUNTY + min(($user->daily_streak ?? 0) * self::STREAK_BONUS_PER_DAY, self::MAX_STREAK_BONUS),
        ];
    }
}
