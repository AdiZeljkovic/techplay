<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The quest board stops being empty: Season 1 and the initial quest set.
 *
 * Every quest here is tied to an action that is ALSO a chronicle signal —
 * completing quests literally accelerates the system's learning about the
 * player, which is the whole design. Criteria types are the ones the code
 * already fires (daily_login, game_added, game_completed, streak_days)
 * plus the two wired alongside this migration (session_logged,
 * game_rated).
 *
 * A data migration rather than a seeder so production receives it through
 * the same `migrate` step as everything else. Idempotent by name.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('seasons')->where('slug', 'season-1-ignition')->exists()) {
            return;
        }

        $seasonId = DB::table('seasons')->insertGetId([
            'name' => 'Season 1: Ignition',
            'slug' => 'season-1-ignition',
            'description' => 'The first TechPlay season. Build your shelf, log your sessions, earn your place.',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'is_active' => true,
            'xp_multiplier' => 1.0,
            'bounty_multiplier' => 1.0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $quests = [
            // ── daily ────────────────────────────────────────────────────
            ['Check In', 'Visit TechPlay and claim your streak.', '🔥', 'daily', 'daily_login', 1, 25, 10, null],
            ['Shelf Builder', 'Add a game to your collection.', '📚', 'daily', 'game_added', 1, 30, 10, null],
            ['Session Logged', 'Log a play session in your journal.', '🎮', 'daily', 'session_logged', 1, 40, 15, null],

            // ── weekly ───────────────────────────────────────────────────
            ['The Finisher', 'Complete a game this week.', '🏁', 'weekly', 'game_completed', 1, 150, 50, null],
            ['The Critic', 'Rate three games from your shelf.', '⭐', 'weekly', 'game_rated', 3, 120, 40, null],
            ['Journal Keeper', 'Log five sessions this week.', '📓', 'weekly', 'session_logged', 5, 150, 50, null],
            ['Streak Week', 'Keep a seven-day streak alive.', '⚡', 'weekly', 'streak_days', 7, 200, 60, null],

            // ── seasonal ─────────────────────────────────────────────────
            ['Season Grind', 'Complete five games before the season ends.', '🏆', 'monthly', 'game_completed', 5, 500, 150, $seasonId],
            ['Season Chronicler', 'Log twenty sessions this season.', '📜', 'monthly', 'session_logged', 20, 600, 200, $seasonId],
        ];

        foreach ($quests as [$name, $description, $icon, $type, $criteria, $value, $xp, $bounty, $season]) {
            DB::table('quests')->insert([
                'name' => $name,
                'description' => $description,
                'icon' => $icon,
                'type' => $type,
                'criteria_type' => $criteria,
                'criteria_value' => $value,
                'xp_reward' => $xp,
                'bounty_reward' => $bounty,
                'is_active' => true,
                'season_id' => $season,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        $seasonId = DB::table('seasons')->where('slug', 'season-1-ignition')->value('id');
        DB::table('quests')->whereIn('name', [
            'Check In', 'Shelf Builder', 'Session Logged', 'The Finisher', 'The Critic',
            'Journal Keeper', 'Streak Week', 'Season Grind', 'Season Chronicler',
        ])->delete();
        DB::table('seasons')->where('id', $seasonId)->delete();
    }
};
