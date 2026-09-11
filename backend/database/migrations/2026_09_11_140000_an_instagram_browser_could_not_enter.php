<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The column that turned an Instagram visitor away.
 *
 * `giveaway_entries.user_agent` was varchar(255). A browser string is not a
 * name or a title — it is whatever the client says about itself, and the
 * in-app browsers are the longest of all. The one that found this:
 *
 *   Mozilla/5.0 (Linux; Android 13; M2101K6G Build/TKQ1.221013.002; wv)
 *   AppleWebKit/537.36 … Chrome/152.0.7977.69 Mobile Safari/537.36
 *   Instagram 445.0.0.45.83 Android (33/13; 440dpi; 1080x2400; Xiaomi/Redmi;
 *   M2101K6G; sweet; qcom; bs_BA; 1055488490; IABMV/1)
 *
 * Just over 300 characters, so the INSERT failed and the reader got a server
 * error. Not a rare shape either: Instagram and Facebook's Android browsers
 * append the device, the screen, the locale and a build number to an already
 * long Chrome string — which means everybody arriving from the ad on an
 * Android phone hit this, and only them. It was invisible from the inside
 * because a desktop browser's string is half the length.
 *
 * `sessions.user_agent` was already `text`, which is why the same person could
 * sign in perfectly well and then fail at the one button the ad was paying to
 * get them to press.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * Postgres only, and guarded rather than assumed.
         *
         * Production is Postgres and always has been, but the test suite runs
         * on in-memory SQLite — where this exact statement is a syntax error
         * and takes every test in the file down with it, which is how the
         * guard came to be here. SQLite does not enforce varchar lengths at
         * all, so there is nothing for it to do.
         */
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE giveaway_entries ALTER COLUMN user_agent TYPE text');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // Truncate first: rows written since the change may be longer than the
        // old column, and the rollback would fail on them rather than say so.
        DB::statement('UPDATE giveaway_entries SET user_agent = LEFT(user_agent, 255)');
        DB::statement('ALTER TABLE giveaway_entries ALTER COLUMN user_agent TYPE varchar(255)');
    }
};
