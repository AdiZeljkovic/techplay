<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\ConnectedAccount;
use App\Models\Friendship;
use App\Models\GameRating;
use App\Models\Order;
use App\Models\User;
use App\Models\UserGame;
use App\Notifications\AchievementUnlockedNotification;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
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
                ->where('criteria_type', '!=', 'special') // special = manual admin grant only
                ->where('is_hidden', false);              // unreleased features stay unreachable

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

            // Meta achievements count other achievements, so an unlock can
            // itself satisfy one. Sweep once more — but only when this pass
            // wasn't already the meta pass, so it can never recurse.
            if ($unlocked && $types !== ['achievements_count']) {
                $unlocked = array_merge($unlocked, $this->check($user, ['achievements_count']));
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
     * Every criteria type's current value for this user, keyed by type.
     *
     * The progress readout on the achievements page needs exactly the numbers
     * the unlock check already computes — this exposes them rather than
     * growing a second, drifting implementation.
     *
     * @param  string[]  $types  the criteria types actually in play
     * @return array<string,int>
     */
    public function currentValues(User $user, array $types): array
    {
        $values = [];

        foreach (array_unique($types) as $type) {
            $value = $this->resolveValue($user, $type);
            if ($value !== null) {
                $values[$type] = $value;
            }
        }

        return $values;
    }

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

            'solutions_count' => $user->posts()->where('is_solution', true)->count(),

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

            // Linking an account and being in the server are different
            // facts. This counted the link, so somebody who connected once and
            // left years ago still held the badge for being part of the
            // community. The bot reports the membership; if it has never
            // reported at all, the link still counts, so nobody loses a badge
            // to a bot that has not been deployed yet.
            'discord' => $user->discord_id
                ? (($user->discord_guild_checked_at === null || $user->discord_guild_member) ? 1 : 0)
                : 0,

            'daily_streak' => (int) ($user->daily_streak ?? 0),

            // Game collection criteria (Phase A)
            'games_added' => $user->userGames()->count(),

            'games_completed' => $user->userGames()->where('status', 'completed')->count(),

            // A replay is play, so it counts here too — otherwise starting
            // one would take a game off this tally and could revoke a badge.
            'games_playing' => $user->userGames()->whereIn('status', UserGame::ACTIVE)->count(),

            'games_wishlisted' => $user->userGames()->where('status', 'wishlist')->count(),

            'connected_accounts' => ConnectedAccount::where('user_id', $user->id)->count(),

            // ─── 2026 catalog ────────────────────────────────────────────────

            // Distinct platforms the user has tagged entries with
            'collection_platforms' => $user->userGames()
                ->whereNotNull('platform')
                ->where('platform', '!=', '')
                ->distinct()
                ->count('platform'),

            // Completions that came out of the backlog — its own progression line
            'backlog_completed' => $user->userGames()
                ->where('status', 'completed')
                ->where('from_backlog', true)
                ->count(),

            // Published ratings that actually say something (empty scores don't count)
            'ratings_count' => GameRating::where('user_id', $user->id)
                ->where('is_draft', false)
                ->whereNotNull('review')
                ->count(),

            // ~500 words ≈ 2500 characters; portable across pgsql and sqlite
            'long_posts' => $user->posts()->whereRaw('LENGTH(content) >= ?', [2500])->count(),

            // Distinct days with real activity, as opposed to the unbroken streak
            'active_days' => (int) ($user->active_days_count ?? 0),

            // Upvotes collected on threads the user started
            'thread_upvotes_received' => $this->resolveThreadUpvotes($user),

            // Meta: how many achievements are already unlocked
            'achievements_count' => $user->achievements()->count(),

            // Registered before the public launch date
            'early_adopter' => $this->resolveEarlyAdopter($user),

            default => null,
        };
    }

    private function resolveThreadUpvotes(User $user): int
    {
        try {
            return (int) DB::table('thread_upvotes')
                ->join('threads', 'thread_upvotes.thread_id', '=', 'threads.id')
                ->where('threads.user_id', $user->id)
                ->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveEarlyAdopter(User $user): int
    {
        $cutoff = config('achievements.early_adopter_before');

        if (! $cutoff || ! $user->created_at) {
            return 0;
        }

        try {
            return $user->created_at->lt(Carbon::parse($cutoff)) ? 1 : 0;
        } catch (\Throwable) {
            return 0;
        }
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

    /**
     * Grant it once, and let the database be the one to say so.
     *
     * The check below is not a guarantee: `achievements:sync` runs nightly and
     * the same unlock can be reached from a web request in the same moment, so
     * both can see it missing. `user_achievements` carries a unique index on
     * (user_id, achievement_id) which makes the second insert fail rather than
     * duplicate — but an unhandled failure is a 500 for the reader, or a nightly
     * command that stops halfway through the remaining members.
     *
     * Catching the violation turns that into what it should have been all along:
     * the loser of the race quietly returns false, and only the winner announces
     * anything or pays anything out.
     */
    private function unlock(User $user, Achievement $achievement): bool
    {
        if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
            return false;
        }

        try {
            $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);
        } catch (UniqueConstraintViolationException) {
            return false;
        }

        // An unlock is the one thing on the site worth interrupting somebody
        // for, and it used to arrive as a notification they might read later.
        app(RewardLedger::class)->unlocked($achievement->name, $achievement->versionedIconPath());

        try {
            $user->notify(new AchievementUnlockedNotification($achievement));
        } catch (\Throwable) {
            // Never let notification failure block the achievement unlock.
        }

        return true;
    }
}
