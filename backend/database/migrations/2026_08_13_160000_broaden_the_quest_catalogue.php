<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Quests that cover the platform, not one corner of it.
 *
 * The nine that existed all counted the same two things — the collection and
 * the journal. Somebody who spent every evening on the forum, wrote lists and
 * made friends could finish a whole season without a single quest noticing.
 *
 * Four layers, each answering a different question:
 *
 *   permanent  — "what is this place?"      a first-week chain, done once
 *   daily      — "why come back today?"
 *   weekly     — "why come back this week?"
 *   monthly    — "why stay for the season?"
 *
 * Every criteria type below has a live trigger. That is not a detail: the
 * achievement catalogue spent months offering twelve badges nobody could earn
 * because their criteria were never checked at the moment they came true, and
 * a quest nobody can finish is the same mistake with a progress bar on it.
 */
return new class extends Migration
{
    /**
     * Rewards follow the scale already set by the nine that exist: a daily is
     * worth 25–40 XP, a weekly 120–200, a monthly 500–600. The onboarding
     * chain pays a little above a daily — it is done once, and the first
     * hour is the one worth buying.
     */
    private const QUESTS = [
        // ── first week: one lap of the whole site ────────────────────────
        ['Welcome Aboard', 'Verify your email and set up your profile.', 'permanent', 'daily_login', 1, 50, 25, 'user'],
        ['Stock the Shelf', 'Add 5 games to your collection.', 'permanent', 'game_added', 5, 100, 40, 'library'],
        ['First Words', 'Write your first comment anywhere on the site.', 'permanent', 'comment_posted', 1, 60, 25, 'message-circle'],
        ['Say Something', 'Post on the forum for the first time.', 'permanent', 'forum_post', 1, 80, 30, 'messages-square'],
        ['Make Your Case', 'Publish your first game list.', 'permanent', 'list_published', 1, 120, 50, 'list'],

        // ── daily: a reason to come back today ───────────────────────────
        ['Roll Call', 'Post a comment today.', 'daily', 'comment_posted', 1, 25, 10, 'message-circle'],
        ['Speak Up', 'Write a forum post today.', 'daily', 'forum_post', 1, 30, 12, 'messages-square'],

        // ── weekly: a reason to come back this week ──────────────────────
        ['Curator', 'Publish a game list this week.', 'weekly', 'list_published', 1, 180, 60, 'list'],
        ['Regular', 'Make 5 forum posts this week.', 'weekly', 'forum_post', 5, 200, 65, 'messages-square'],
        ['Conversationalist', 'Leave 10 comments this week.', 'weekly', 'comment_posted', 10, 160, 55, 'message-circle'],
        ['Good Company', 'Make a new friend this week.', 'weekly', 'friend_made', 1, 140, 45, 'users'],

        // ── monthly: a reason to stay for the season ─────────────────────
        ['Season Voice', 'Start 5 discussions this season.', 'monthly', 'thread_started', 5, 550, 175, 'messages-square'],
        ['Season Curator', 'Publish 3 game lists this season.', 'monthly', 'list_published', 3, 600, 200, 'list'],
        ['Season Critic', 'Review 10 games this season.', 'monthly', 'game_rated', 10, 550, 175, 'star'],
    ];

    public function up(): void
    {
        foreach (self::QUESTS as [$name, $description, $type, $criteria, $value, $xp, $bounty, $icon]) {
            // Keyed on the name: quests carry no slug, and re-running this
            // must not double the catalogue.
            DB::table('quests')->updateOrInsert(
                ['name' => $name],
                [
                    'description' => $description,
                    'type' => $type,
                    'criteria_type' => $criteria,
                    'criteria_value' => $value,
                    'xp_reward' => $xp,
                    'bounty_reward' => $bounty,
                    'icon' => $icon,
                    'is_active' => true,
                    // Deliberately season-agnostic. Pinning a quest to a season
                    // means it disappears the day that season closes, which is
                    // exactly what happened to the two that had to be unpinned
                    // in the seasons migration.
                    'season_id' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('quests')
            ->whereIn('name', array_column(self::QUESTS, 0))
            ->delete();
    }
};
