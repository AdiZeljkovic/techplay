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

        // Update level if needed (simple logic provided)
        $this->checkLevelUp($user);
    }

    protected function checkLevelUp(User $user): void
    {
        $newLevel = floor($user->xp / 1000) + 1;
        if ($newLevel > $user->level) {
            $user->level = $newLevel;
            $user->save();
            // Could fire LevelUp event here
        }
    }
}
