<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;

class AchievementService
{
    /**
     * Check and award XP-based achievements for a user.
     * Returns array of newly unlocked achievements.
     */
    public function checkXpAchievements(User $user): array
    {
        $unlocked = [];
        $xp = $user->xp ?? 0;

        // XP Milestones
        $xpMilestones = [
            100 => 'XP Novice',
            500 => 'XP Apprentice',
            1000 => 'XP Veteran',
            5000 => 'XP Master',
            10000 => 'XP Legend',
        ];

        foreach ($xpMilestones as $threshold => $achievementName) {
            if ($xp >= $threshold) {
                $achievement = Achievement::where('name', $achievementName)->first();
                if ($achievement && $this->unlock($user, $achievement)) {
                    $unlocked[] = $achievement;
                }
            }
        }

        return $unlocked;
    }

    /**
     * Check Discord-specific achievements.
     */
    public function checkDiscordAchievements(User $user): array
    {
        $unlocked = [];

        // Check if user has Discord linked
        if ($user->discord_id) {
            $achievement = Achievement::where('name', 'Discord Linked')->first();
            if ($achievement && $this->unlock($user, $achievement)) {
                $unlocked[] = $achievement;
            }
        }

        return $unlocked;
    }

    /**
     * Unlock an achievement for a user if not already unlocked.
     */
    protected function unlock(User $user, Achievement $achievement): bool
    {
        if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
            return false;
        }

        $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);
        return true;
    }

    /**
     * Check all achievements for a user (used after significant actions).
     */
    public function checkAllAchievements(User $user): array
    {
        $allUnlocked = [];

        $allUnlocked = array_merge($allUnlocked, $this->checkXpAchievements($user));
        $allUnlocked = array_merge($allUnlocked, $this->checkDiscordAchievements($user));

        return $allUnlocked;
    }
}
