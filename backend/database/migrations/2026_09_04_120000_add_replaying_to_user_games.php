<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Playing something a second time is not the same as playing it a first time.
 *
 * The shelf had six states and none of them fitted a replay. `playing` threw
 * away the fact that you had finished it; `completed` denied that you were
 * playing it now. So people either lied to the shelf or left the game where it
 * was and the library stopped describing what they were actually doing.
 *
 * Goodreads settled this years ago: a book can be read again, and the shelf
 * counts the times. This is that, for games — a `replaying` status, and a
 * count so "the eighth time" is a fact the library holds rather than a
 * sentence in a note.
 *
 * The count is completions, not attempts. It goes up when a replay is
 * finished, which is the only moment anyone can point at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->unsignedSmallInteger('playthroughs')->default(0)->after('progress');
        });

        /*
         * Anyone already carrying a finish has one to their name.
         *
         * `completed_at` rather than the status, because the status moves: a
         * game finished last year and since dropped still has the stamp, and
         * the count is a history rather than a description of today.
         */
        DB::table('user_games')
            ->where(function ($q) {
                $q->whereNotNull('completed_at')->orWhere('status', 'completed');
            })
            ->update(['playthroughs' => 1]);
    }

    public function down(): void
    {
        // Nothing here rescues a `replaying` row: the status would no longer
        // validate, so send those back to `playing`, which is the nearest true
        // thing about them.
        DB::table('user_games')->where('status', 'replaying')->update(['status' => 'playing']);

        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('playthroughs');
        });
    }
};
