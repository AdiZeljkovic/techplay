<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The backlog was holding games that had already been played.
 *
 * Library imports filed anything not touched in the last fortnight as
 * `backlog`, whatever the platform said about lifetime playtime. On the first
 * real Steam import that was 91 of 189 backlog entries, one of them 1,602
 * hours of Lord of the Rings Online — and the Backlog Advisor, which exists to
 * choose from what you have *not* played, was picking from that.
 *
 * `played` now carries them. This moves only rows that state their own case:
 * status still `backlog`, and playtime greater than zero. A reader who filed
 * something as backlog by hand and never played it is untouched, and so is
 * anything they marked completed, dropped or playing themselves.
 *
 * The column is a plain string with an index, so there is no enum to alter —
 * only rows to correct.
 */
return new class extends Migration
{
    public function up(): void
    {
        $moved = DB::table('user_games')
            ->where('status', 'backlog')
            ->where(function ($q) {
                $q->where('hours_played', '>', 0)
                    ->orWhere('playtime_minutes', '>', 0);
            })
            ->update(['status' => 'played']);

        // Worth saying out loud during a deploy: this rewrites people's
        // shelves, and the number should look like the audit that prompted it.
        echo "  moved {$moved} played games out of the backlog\n";
    }

    public function down(): void
    {
        // Every row this touched was `backlog` a moment ago, and only rows with
        // playtime were touched — so the reversal is exact rather than a guess.
        DB::table('user_games')
            ->where('status', 'played')
            ->where(function ($q) {
                $q->where('hours_played', '>', 0)
                    ->orWhere('playtime_minutes', '>', 0);
            })
            ->update(['status' => 'backlog']);
    }
};
