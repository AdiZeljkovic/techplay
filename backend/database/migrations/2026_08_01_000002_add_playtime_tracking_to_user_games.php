<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Playtime can only be measured where a real signal exists: the Steam API
 * (total playtime per title) or a live presence session (Discord Rich
 * Presence, or the manual "now playing" picker). Everything else is unknown,
 * and the UI must be able to say so rather than showing a zero.
 *
 *  - playtime_minutes: the accumulator. Sessions are usually shorter than an
 *    hour, so minutes are the unit of record; hours_played stays the rounded
 *    display value other code already reads.
 *  - playtime_source: which signal produced the number, so the UI can label
 *    it and so Steam's authoritative total is never overwritten by sessions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->unsignedInteger('playtime_minutes')->default(0);
            $table->string('playtime_source', 16)->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn(['playtime_minutes', 'playtime_source']);
        });
    }
};
