<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class XpService
{
    public const XP_COMMENT = 10;
    public const XP_ARTICLE_READ = 5;
    public const DAILY_XP_CAP = 100;
    public const COMMENT_COOLDOWN_SECONDS = 60;

    /**
     * Award XP to a user for a specific action, respecting caps and cooldowns.
     */
    public function awardXp(User $user, int $amount, string $actionType): void
    {
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

        // Update rank if needed
        $this->checkRankUpdate($user);
    }

    protected function checkRankUpdate(User $user): void
    {
        // Find the highest rank the user qualifies for based on XP
        // Assuming 'min_xp' is the column name as per User model usage
        $newRank = \App\Models\Rank::where('min_xp', '<=', $user->xp)
            ->orderBy('min_xp', 'desc')
            ->first();

        if ($newRank && $newRank->id !== $user->rank_id) {
            $user->rank_id = $newRank->id;
            $user->save();
            // Could fire RankUp event here
        }
    }
}
