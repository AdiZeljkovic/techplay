<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An achievement is unlocked once, and the database should be the one saying so.
 *
 * `AchievementService` checks whether the row exists and then attaches it —
 * two statements with a gap between them. Two grantors in that gap both pass
 * the check and both insert: the nightly `achievements:sync` and an inline
 * grant from the same action are exactly such a pair. Nothing would error; the
 * leaderboard counts raw rows, so the duplicate simply becomes a point, and
 * the rarity figure every achievement displays is a count of the same table.
 *
 * There are no duplicates today — checked on production before writing this —
 * so the cleanup below is a precaution rather than a repair. After it, a race
 * that used to write a second row raises a constraint violation instead, which
 * `attach` surfaces rather than swallowing.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * Keep the earliest unlock of each pair: it is the one that actually
         * happened, and `unlocked_at` is what the profile displays.
         *
         * Written with a subquery rather than Postgres' `DELETE … USING`, so
         * the test suite — which runs on SQLite — executes the same statement
         * the production database will. A migration whose cleanup step is
         * skipped in tests is a cleanup nobody has ever run.
         */
        DB::statement('
            DELETE FROM user_achievements
            WHERE id NOT IN (
                SELECT min_id FROM (
                    SELECT MIN(id) AS min_id
                    FROM user_achievements
                    GROUP BY user_id, achievement_id
                ) AS keepers
            )
        ');

        Schema::table('user_achievements', function (Blueprint $table) {
            $table->unique(['user_id', 'achievement_id'], 'user_achievements_user_achievement_unique');
        });
    }

    public function down(): void
    {
        Schema::table('user_achievements', function (Blueprint $table) {
            $table->dropUnique('user_achievements_user_achievement_unique');
        });
    }
};
