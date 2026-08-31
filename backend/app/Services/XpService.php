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

    public const XP_GAME_ADDED = 5;

    public const XP_GAME_COMPLETED = 15;

    public const XP_GAME_REVIEW = 10;

    /**
     * A message in the Discord server.
     *
     * Worth more than a comment on the site looks odd until you notice the
     * daily cap governs both: at 15 a message on a 60-second cooldown, seven
     * messages reach the ceiling and the eighth pays nothing. Before this ran
     * through here it was uncapped, and a talkative evening was worth more XP
     * than a year of finishing games.
     */
    public const XP_DISCORD_MESSAGE = 15;

    public const DAILY_XP_CAP = 100;

    public const COMMENT_COOLDOWN_SECONDS = 60;

    /**
     * Award XP to a user for a specific action, respecting caps and cooldowns.
     * Season XP multiplier is applied to the base amount (still subject to the daily cap).
     *
     * @param  bool  $respectDailyCap  False only for rewards that cannot be
     *                                 repeated to order. The cap exists to stop somebody farming comments and
     *                                 shelf additions all afternoon; a quest pays once per day, week, month or
     *                                 once ever, and the period reset is what limits it. Leaving quests inside
     *                                 the cap made their advertised rewards fiction — a quest offering 600 XP
     *                                 paid whatever was left of a hundred, and the rest was silently dropped.
     */
    public function awardXp(User $user, int $amount, string $actionType, bool $respectDailyCap = true): void
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

        if ($amount <= 0) {
            return;
        }

        // 2. Daily cap, counted atomically.
        //
        // Two problems lived here. Read-then-increment let concurrent awards
        // each see the same total and all pass — twenty parallel "game added"
        // calls were twenty full awards against one cap. And Cache::increment
        // issues a bare Redis INCRBY, which creates the key with **no expiry**:
        // one permanent key per user per day, accumulating forever on a Redis
        // instance that has no eviction policy.
        //
        // add() sets the TTL only when the key is absent, and INCRBY leaves an
        // existing TTL alone — so the counter still dies at midnight.
        $date = now()->format('Y-m-d');
        $dailyKey = "user:{$user->id}:xp:{$date}";
        $actualAmount = $amount;

        if ($respectDailyCap) {
            Cache::add($dailyKey, 0, now()->endOfDay());

            $afterAward = (int) Cache::increment($dailyKey, $amount);

            if ($afterAward > self::DAILY_XP_CAP) {
                $overshoot = $afterAward - self::DAILY_XP_CAP;
                $actualAmount = $amount - $overshoot;

                // Hand back what went over so the counter settles on the cap.
                Cache::decrement($dailyKey, $overshoot);
            }

            if ($actualAmount <= 0) {
                return; // Daily cap reached
            }
        }

        // 3. Award XP
        $user->increment('xp', $actualAmount);

        // What was actually paid, not what was asked for — the daily cap and
        // the season multiplier both move this number, and the page should
        // show the one that landed.
        app(RewardLedger::class)->xp($actualAmount, $actionType);

        // NOTE (economy split, V2): XP no longer mirrors into Bounty.
        // XP = progression; Bounty = currency earned through deliberate
        // actions (daily streak, quests, game completions, publishing,
        // reviews, accepted solutions).

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

        if (! $newRank || $newRank->id === $user->rank_id) {
            return;
        }

        // A rank can move down as well as up — ranks get re-thresholded in the
        // admin panel, and the row simply reflects whatever the ladder says
        // today. Announcing that as a promotion is worse than saying nothing.
        // Queried rather than read off the relation: lazy loading throws
        // outside production, and this runs on every award.
        $previousThreshold = $user->rank_id
            ? Rank::whereKey($user->rank_id)->value('min_xp')
            : null;
        $isPromotion = $previousThreshold === null || $newRank->min_xp > $previousThreshold;

        $user->rank_id = $newRank->id;
        $user->save();

        if (! $isPromotion) {
            return;
        }

        app(RewardLedger::class)->promoted($newRank);

        try {
            $user->notify(new RankUpNotification($newRank));
        } catch (\Throwable) {
        }
    }
}
