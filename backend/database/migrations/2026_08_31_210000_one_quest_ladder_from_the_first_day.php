<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One ladder, from the empty profile to the end of the year.
 *
 * Measured on production before writing this: 45 of 55 members have zero XP,
 * and the funnel is 55 registered → 50 confirmed → 21 entered a giveaway → 7
 * commented → 3 added a game → 2 linked a platform. Eleven of the 42 quests in
 * the catalogue asked for ratings and forum replies — the two things nobody had
 * ever done — while nothing at all rewarded linking a library or entering a
 * giveaway, which are the two widest doors into the site.
 *
 * Three things shaped the numbers below.
 *
 * The board shows eleven quests, not forty-two: `QuestController::shortlist()`
 * takes 3 daily, 3 weekly, 5 monthly and 5 permanent, rotated per reader per
 * period. A longer catalogue does not mean a member sees more; it means the
 * eleven they see are more likely to include a near-duplicate.
 *
 * Achievements already own the permanent ladder — 67 of them across 29 criteria
 * — so permanent quests here are a short opening chain and nothing more. The
 * old catalogue paid twice for the same act: `Streak Warrior` and
 * `One Week Strong` are both seven days.
 *
 * And XP is capped at 100 a day, which quest rewards now bypass (see
 * QuestService::grantRewards). Before that, a 600 XP quest paid whatever was
 * left of a hundred. The XP figures here are deliberately modest anyway; the
 * weight sits in Bounty, which has no ceiling.
 *
 * Nothing is deleted. `quest_progress` is `cascadeOnDelete`, and there are 71
 * rows of it belonging to five members — dropping a quest would erase what
 * they had done. Quests that survive are matched by criteria and cadence and
 * updated in place, so progress carries over; everything else is switched off.
 */
return new class extends Migration
{
    /**
     * [name, description, icon, type, criteria_type, criteria_value, xp, bounty]
     *
     * Names stay in English: the frontend prints `quest.name` verbatim and the
     * site is English throughout.
     */
    private const CORE = [
        // ── The opening chain. Permanent, and the only permanent ones. ──────
        // Day one should reach Player (100 XP) and the first week Rookie (300).
        ['Welcome Aboard', 'Claim your daily streak for the first time.', 'flame', 'permanent', 'daily_login', 1, 40, 30],
        ['Link Your Library', 'Connect Steam, Xbox, PlayStation, GOG or Epic and bring your games with you.', 'link', 'permanent', 'platform_connected', 1, 60, 100],
        ['First Game', 'Add your first game to your collection.', 'plus-circle', 'permanent', 'game_added', 1, 40, 40],
        ['Stock the Shelf', 'Get ten games onto your shelf.', 'library', 'permanent', 'game_added', 10, 60, 80],
        ['First Words', 'Leave your first comment anywhere on the site.', 'message-circle', 'permanent', 'comment_posted', 1, 40, 30],
        ['First Session', 'Log your first play session.', 'gamepad-2', 'permanent', 'session_logged', 1, 50, 50],
        ['First Completion', 'Mark your first game completed.', 'check-circle', 'permanent', 'game_completed', 1, 60, 100],
        ['Try Your Luck', 'Enter a giveaway.', 'gift', 'permanent', 'giveaway_entered', 1, 40, 50],

        // ── Daily. Small on purpose — three of these show at once. ──────────
        ['Check In', 'Claim your streak today.', 'flame', 'daily', 'daily_login', 1, 20, 15],
        // Not "Say Something" — that name belongs to the retired forum quest,
        // and two rows reading the same in the admin list is how the old
        // catalogue grew its duplicates in the first place.
        ['Chime In', 'Post a comment today.', 'message-circle', 'daily', 'comment_posted', 1, 25, 15],
        ['Log a Session', 'Record a play session today.', 'gamepad-2', 'daily', 'session_logged', 1, 30, 20],
        ['Add a Game', 'Put one more game on the shelf today.', 'library', 'daily', 'game_added', 1, 20, 15],

        // ── Weekly. Thresholds set to what people actually manage. ──────────
        ['Five Days Running', 'Keep a five-day streak alive.', 'flame', 'weekly', 'streak_days', 5, 60, 60],
        ['Finish One', 'Complete a game this week.', 'check-circle', 'weekly', 'game_completed', 1, 60, 80],
        ['Five Sessions', 'Log five play sessions this week.', 'notebook-pen', 'weekly', 'session_logged', 5, 60, 70],
        ['Rate a Game', 'Give one game from your shelf a score.', 'star', 'weekly', 'game_rated', 1, 60, 60],
        ['Five Comments', 'Leave five comments this week.', 'message-circle', 'weekly', 'comment_posted', 5, 50, 50],
        ['Make a Friend', 'Add someone to your friends list.', 'users', 'weekly', 'friend_made', 1, 50, 60],

        // ── Monthly. Bounty carries the weight here. ────────────────────────
        ['Three Finished', 'Complete three games this month.', 'trophy', 'monthly', 'game_completed', 3, 80, 250],
        ['Twenty Days', 'Claim your streak on twenty days this month.', 'zap', 'monthly', 'streak_days', 20, 80, 300],
        ['Fifteen Sessions', 'Log fifteen play sessions this month.', 'notebook-pen', 'monthly', 'session_logged', 15, 80, 220],
        ['Five Ratings', 'Score five games this month.', 'star', 'monthly', 'game_rated', 5, 80, 200],
        ['Two Discussions', 'Start two forum threads this month.', 'messages-square', 'monthly', 'thread_started', 2, 80, 180],
    ];

    /**
     * Seasonal quests are `permanent` with a `season_id` — the type the rest of
     * the code already expects. A `monthly` season quest would reset halfway
     * through a two-month season; a permanent one runs its whole length, and
     * QuestBoard re-buckets it onto the monthly layer for display.
     *
     * Four each, because `season:conclude` grants the Champion badge only to
     * somebody who finished *every* quest carrying that season_id. Four is a
     * real bar that a member starting from nothing can still clear.
     */
    private const SEASONS = [
        'ignition' => [
            'name' => 'Season 1: Ignition',
            'description' => 'Two months to build a shelf worth looking at.',
            'start' => '2026-09-01',
            'end' => '2026-10-31',
            'xp' => 1.00,
            'bounty' => 1.15,
            'quests' => [
                ['Shelf of Twenty', 'Add twenty games before the season ends.', 'library', 'game_added', 20, 100, 400],
                ['Two to the End', 'Complete two games this season.', 'check-circle', 'game_completed', 2, 100, 350],
                ['Ten Sessions', 'Log ten play sessions this season.', 'notebook-pen', 'session_logged', 10, 100, 300],
                ['Three Ratings', 'Score three games this season.', 'star', 'game_rated', 3, 100, 300],
            ],
        ],
        'overdrive' => [
            'name' => 'Season 2: Overdrive',
            'description' => 'From a shelf to a voice — the season that asks you to say something.',
            'start' => '2026-11-01',
            'end' => '2026-12-31',
            'xp' => 1.00,
            'bounty' => 1.25,
            'quests' => [
                ['Thirty Days Running', 'Keep a thirty-day streak alive.', 'flame', 'streak_days', 30, 100, 500],
                ['Five to the End', 'Complete five games this season.', 'trophy', 'game_completed', 5, 100, 500],
                ['Publish a List', 'Put a game list out where others can read it.', 'list', 'list_published', 1, 100, 350],
                ['Three Discussions', 'Start three forum threads this season.', 'messages-square', 'thread_started', 3, 100, 400],
            ],
        ],
    ];

    public function up(): void
    {
        $now = now();
        $claimed = [];

        /*
         * Summer of Gaming closes on 31 Aug rather than 21 Sep, so it does not
         * overlap the new first season. Nobody loses a badge by it: both members
         * with progress stood at one of its three quests, and `season:conclude`
         * requires all of them.
         */
        DB::table('seasons')->where('slug', 'summer-2026')->update([
            'end_date' => '2026-08-31',
            'is_active' => false,
            'updated_at' => $now,
        ]);

        // ── Seasons ─────────────────────────────────────────────────────────
        $seasonIds = [];

        foreach (self::SEASONS as $slug => $season) {
            $existing = DB::table('seasons')
                ->where('slug', 'like', '%'.$slug.'%')
                ->orWhere('name', $season['name'])
                ->first();

            $row = [
                'name' => $season['name'],
                'slug' => $slug,
                'description' => $season['description'],
                'start_date' => $season['start'],
                'end_date' => $season['end'],
                'is_active' => true,
                'xp_multiplier' => $season['xp'],
                'bounty_multiplier' => $season['bounty'],
                'updated_at' => $now,
            ];

            if ($existing) {
                DB::table('seasons')->where('id', $existing->id)->update($row);
                $seasonIds[$slug] = $existing->id;
            } else {
                $seasonIds[$slug] = DB::table('seasons')->insertGetId($row + ['created_at' => $now]);
            }
        }

        // ── Core quests ─────────────────────────────────────────────────────
        foreach (self::CORE as [$name, $description, $icon, $type, $criteria, $value, $xp, $bounty]) {
            $claimed[] = $this->settle(
                name: $name, description: $description, icon: $icon, type: $type,
                criteria: $criteria, value: $value, xp: $xp, bounty: $bounty,
                seasonId: null, expiresAt: null, claimed: $claimed, now: $now,
            );
        }

        // ── Season quests ───────────────────────────────────────────────────
        foreach (self::SEASONS as $slug => $season) {
            foreach ($season['quests'] as [$name, $description, $icon, $criteria, $value, $xp, $bounty]) {
                $claimed[] = $this->settle(
                    name: $name, description: $description, icon: $icon, type: 'permanent',
                    criteria: $criteria, value: $value, xp: $xp, bounty: $bounty,
                    seasonId: $seasonIds[$slug], expiresAt: $season['end'].' 23:59:59',
                    claimed: $claimed, now: $now,
                );
            }
        }

        /*
         * Everything else is switched off, not removed. A retired quest keeps
         * its rows in `quest_progress`, so the five members who have completed
         * twenty of them between them keep what they earned, and the board
         * simply stops offering it.
         */
        DB::table('quests')
            ->whereNotIn('id', array_filter($claimed))
            ->where('is_active', true)
            ->update(['is_active' => false, 'updated_at' => $now]);
    }

    /**
     * Reuse the row a member's progress already points at, or make a new one.
     *
     * Matched on cadence, criteria and season rather than on name, because the
     * names are being rewritten: `The Finisher` and `Backlog Buster` were both
     * "complete one game this week", and whichever of them somebody had made
     * progress against should be the one that survives as `Finish One`.
     */
    private function settle(
        string $name, string $description, ?string $icon, string $type,
        string $criteria, int $value, int $xp, int $bounty,
        ?int $seasonId, ?string $expiresAt, array $claimed, $now,
    ): int {
        $match = DB::table('quests')
            ->where('type', $type)
            ->where('criteria_type', $criteria)
            ->when($seasonId === null,
                fn ($q) => $q->whereNull('season_id'),
                fn ($q) => $q->where('season_id', $seasonId))
            ->whereNotIn('id', array_filter($claimed) ?: [0])
            // The closest existing threshold first, then the one somebody has
            // actually been working on.
            ->orderByRaw('abs(criteria_value - ?)', [$value])
            ->orderByRaw('(select count(*) from quest_progress qp where qp.quest_id = quests.id) desc')
            ->first();

        $row = [
            'name' => $name,
            'description' => $description,
            'icon' => $icon,
            'type' => $type,
            'criteria_type' => $criteria,
            'criteria_value' => $value,
            'xp_reward' => $xp,
            'bounty_reward' => $bounty,
            'is_active' => true,
            'season_id' => $seasonId,
            'expires_at' => $expiresAt,
            'updated_at' => $now,
        ];

        if ($match) {
            DB::table('quests')->where('id', $match->id)->update($row);

            return $match->id;
        }

        return DB::table('quests')->insertGetId($row + ['created_at' => $now]);
    }

    /**
     * Deliberately empty.
     *
     * Rolling back would mean restoring 42 quests, three season date ranges and
     * the names members' progress was earned under — from information this file
     * does not hold. Nothing here is destructive: no row is deleted and no
     * progress is touched, so a mistake is fixed forward, in the admin panel.
     */
    public function down(): void {}
};
