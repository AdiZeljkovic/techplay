<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Steam has been telling us where and when, and we kept neither.
 *
 * `GetOwnedGames` returns, per game: playtime split across Windows, Mac, Linux
 * and the Steam Deck, playtime accrued offline, and `rtime_last_played` — the
 * moment the game was last opened. We stored the lifetime total and dropped the
 * rest. On a real library that was 114 games carrying a last-played date
 * spanning 2016 to 2026, thrown away on every sync, while `last_played_at` was
 * being set to `now()` for the handful played in the last fortnight and left
 * null for everything else.
 *
 * `last_played_at` already exists; it only needed filling honestly. This adds
 * the device split beside it.
 *
 * Deliberately not added: hours per year. Steam reports a lifetime total per
 * game and nothing time-sliced, so a column for it could only ever hold a
 * guess — 1,602 hours of an MMO attributed to whichever year it was last
 * opened is a fiction, and a fiction in a column outlives everyone who knew
 * it was one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            // { "windows": 12345, "mac": 0, "linux": 0, "deck": 890,
            //   "offline": 12 } — minutes, as the platform reports them.
            $table->jsonb('device_playtime')->nullable()->after('playtime_source');
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('device_playtime');
        });
    }
};
