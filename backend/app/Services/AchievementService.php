<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\ConnectedAccount;
use App\Models\Friendship;
use App\Models\Order;
use App\Models\User;
use App\Notifications\AchievementUnlockedNotification;
use Illuminate\Support\Facades\Log;

class AchievementService
{
    /**
     * Check achievements for a user, optionally filtered to specific criteria types.
     * This is the single entry point — call it from any action that could trigger unlocks.
     *
     * @param  string[]  $types  If empty, checks all criteria types.
     * @return Achievement[] Newly unlocked achievements.
     */
    public function check(User $user, array $types = []): array
    {
        try {
            $earnedIds = $user->achievements()->pluck('achievement_id');

            $query = Achievement::whereNotIn('id', $earnedIds)
                ->where('criteria_type', '!=', 'special'); // special = manual admin grant only

            if (! empty($types)) {
                $query->whereIn('criteria_type', $types);
            }

            $candidates = $query->orderBy('criteria_value')->get();

            if ($candidates->isEmpty()) {
                return [];
            }

            $byType = $candidates->groupBy('criteria_type');
            $unlocked = [];

            foreach ($byType as $type => $achievements) {
                $userValue = $this->resolveValue($user, $type);

                if ($userValue === null) {
                    continue;
                }

                foreach ($achievements as $achievement) {
                    if ($userValue >= (int) $achievement->criteria_value) {
                        if ($this->unlock($user, $achievement)) {
                            $unlocked[] = $achievement;
                        }
                    }
                }
            }

            return $unlocked;
        } catch (\Throwable $e) {
            Log::warning('AchievementService::check failed: '.$e->getMessage(), [
                'user_id' => $user->id,
                'types' => $types,
            ]);

            return [];
        }
    }

    /**
     * Convenience shortcut: check only XP achievements (called from XpService).
     */
    public function checkXpAchievements(User $user): array
    {
        return $this->check($user, ['xp']);
    }

    /**
     * Convenience shortcut: check only Discord achievements.
     */
    public function checkDiscordAchievements(User $user): array
    {
        return $this->check($user, ['discord']);
    }

    /**
     * Convenience shortcut: check all achievements (use sparingly — many DB queries).
     */
    public function checkAllAchievements(User $user): array
    {
        return $this->check($user);
    }

    /**
     * Directly unlock a named achievement (for manual/special grants).
     */
    public function unlockByName(User $user, string $name): bool
    {
        $achievement = Achievement::where('name', $name)->first();

        return $achievement ? $this->unlock($user, $achievement) : false;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolve the user's current value for a given criteria type.
     * Returns null to skip the entire criteria type (e.g. missing table/relation).
     */
    private function resolveValue(User $user, string $type): ?int
    {
        return match ($type) {
            'xp' => (int) ($user->xp ?? 0),

            'posts_count' => $user->posts()->count(),

            'threads_count' => $user->threads()->count(),

            'comments_count' => $user->comments()->count(),

            'comment_likes_received' => $this->resolveCommentLikes($user),

            'reputation' => (int) ($user->forum_reputation ?? 0),

            'friends_count' => Friendship::where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })->where('status', 'accepted')->count(),

            'gamertags' => count(array_filter((array) ($user->gamertags ?? []))),

            'pc_specs' => count(array_filter((array) ($user->pc_specs ?? []))),

            'email_verified' => $user->hasVerifiedEmail() ? 1 : 0,

            'support_tier' => $this->resolveSupportTier($user),

            'support_duration' => $this->resolveSupportDuration($user),

            'orders_count' => $this->resolveOrdersCount($user),

            'discord' => $user->discord_id ? 1 : 0,

            'daily_streak' => (int) ($user->daily_streak ?? 0),

            // Game collection criteria (Phase A)
            'games_added' => $user->userGames()->count(),

            'games_completed' => $user->userGames()->where('status', 'completed')->count(),

            'games_playing' => $user->userGames()->where('status', 'playing')->count(),

            'games_wishlisted' => $user->userGames()->where('status', 'wishlist')->count(),

            'connected_accounts' => ConnectedAccount::where('user_id', $user->id)->count(),

            default => null,
        };
    }

    private function resolveCommentLikes(User $user): int
    {
        try {
            return (int) $user->comments()
                ->join('comment_likes', 'comments.id', '=', 'comment_likes.comment_id')
                ->where('comment_likes.type', 'up')
                ->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveSupportTier(User $user): int
    {
        try {
            return $user->activeSupport ? 1 : 0;
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveSupportDuration(User $user): int
    {
        try {
            $support = $user->activeSupport;
            if (! $support || ! $support->started_at) {
                return 0;
            }

            return (int) $support->started_at->diffInMonths(now());
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveOrdersCount(User $user): int
    {
        try {
            return Order::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function unlock(User $user, Achievement $achievement): bool
    {
        if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
            return false;
        }

        $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);

        try {
            $user->notify(new AchievementUnlockedNotification($achievement));
        } catch (\Throwable) {
            // Never let notification failure block the achievement unlock.
        }

        return true;
    }
}
