<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sessions the site noticed, waiting for the reader to confirm them.
 *
 * The journal's real problem was never its design — it was that it asked you to
 * sit down and write. Steam already tells us lifetime playtime per game, and we
 * ask it on a schedule. The difference between two answers is a session that
 * happened; all that was missing was somewhere to put it while it waits to be
 * confirmed.
 *
 * Suggestions are proposals, never facts. Nothing is written into the journal
 * until a person says yes, because "Steam counted 140 minutes" and "I played
 * for a bit last night" are different claims and only the second one is a diary
 * entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            // Minutes gained between two readings. Accumulates while the
            // suggestion is still pending, so a day of playing in bursts
            // arrives as one session rather than six.
            $table->unsignedInteger('minutes');

            // Where the number came from. Only 'steam' today; Xbox has no
            // playtime to give and PSN is not connected yet.
            $table->string('source', 16)->default('steam');

            // The day we credit it to, in the reader's own reckoning — the
            // journal records days, not timestamps.
            $table->date('played_on');

            $table->string('status', 12)->default('pending'); // pending | accepted | dismissed
            $table->timestamps();

            // One open suggestion per game per day. A second detection on the
            // same day tops up the one that is already waiting.
            $table->unique(['user_id', 'game_id', 'played_on']);
            $table->index(['user_id', 'status']);
        });

        Schema::table('user_games', function (Blueprint $table) {
            // What the last sync saw. Without it there is no "before" to
            // subtract from, and every sync would look like the first one.
            $table->unsignedInteger('playtime_seen_minutes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('playtime_seen_minutes');
        });

        Schema::dropIfExists('session_suggestions');
    }
};
