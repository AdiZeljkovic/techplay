<?php

namespace App\Services;

use App\Models\Rank;
use App\Models\Season;
use App\Models\User;
use App\Notifications\RankUpNotification;
use Illuminate\Support\Facades\Cache;

class XpService
{
    public const XP_COMMENT = 10;

    public const XP_ARTICLE_READ = 5;

    public const XP_GAME_ADDED = 5;

    public const XP_GAME_COMPLETED = 15;

    public const XP_GAME_REVIEW = 10;

    public const DAILY_XP_CAP = 100;

    public const COMMENT_COOLDOWN_SECONDS = 60;

    /**
     * Award XP to a user for a specific action, respecting caps and cooldowns.
     * Season XP multiplier is applied to the base amount (still subject to the daily cap).
     */
    public function awardXp(User $user, int $amount, string $actionType): void
    {
        $amount = (int) round($amount * Season::multipliers()['xp']);

        // 1. Check strict cooldown for comments to prevent spam
        if ($actionType === 'comment') {
            $lastCommentKey = "user:{$user->id}:last_comment_time";
            if (Cache::has($lastCommentKey)) {
                return; // Cooldown active, no XP awarded
            }
            Cache::put($lastCommentKey, now(), self::COMMENT_COOLDOWN_SECONDS);
        }

        // 2. Check Daily Cap
        $date = now()->format('Y-m-d');
        $dailyKey = "user:{$user->id}:xp:{$date}";
        $currentDailyXp = Cache::get($dailyKey, 0);

        if ($currentDailyXp >= self::DAILY_XP_CAP) {
            return; // Daily cap reached
        }

        // 3. Award XP (and cap it if adding amount exceeds limit)
        $actualAmount = min($amount, self::DAILY_XP_CAP - $currentDailyXp);

        $user->increment('xp', $actualAmount);
        Cache::increment($dailyKey, $actualAmount);

        // Mirror the XP gain as Bounty currency (1:1) for the rewards store.
        // applySeason=false — the amount already carries the season XP multiplier.
        if ($actualAmount > 0) {
            try {
                app(BountyService::class)->award($user, $actualAmount, "Earned from {$actionType}", 'earn', false);
            } catch (\Throwable $e) {
                // Never let bounty accounting block XP awarding.
                \Log::warning('Bounty award failed: '.$e->getMessage());
            }
        }

        // Update rank if needed
        $this->checkRankUpdate($user);

        // Check XP-based achievements (fire-and-forget, never blocks XP)
        try {
            app(AchievementService::class)->checkXpAchievements($user);
        } catch (\Throwable) {
        }
    }

    protected function checkRankUpdate(User $user): void
    {
        // Find the highest rank the user qualifies for based on XP
        // Assuming 'min_xp' is the column name as per User model usage
        $newRank = Rank::where('min_xp', '<=', $user->xp)
            ->orderBy('min_xp', 'desc')
            ->first();

        if ($newRank && $newRank->id !== $user->rank_id) {
            $user->rank_id = $newRank->id;
            $user->save();
            try {
                $user->notify(new RankUpNotification($newRank));
            } catch (\Throwable) {
            }
        }
    }
}
