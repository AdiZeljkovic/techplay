<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracking the 2026 achievement catalog needs three facts nothing recorded:
 *  - which completions came out of the backlog (the backlog line is separate
 *    from the plain "games completed" line),
 *  - how many distinct days a user has been active (separate from the
 *    unbroken streak),
 *  - which achievements are not obtainable yet, so unreleased features don't
 *    advertise unreachable trophies.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->boolean('from_backlog')->default(false)->index();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('active_days_count')->default(0);
        });

        Schema::table('achievements', function (Blueprint $table) {
            $table->boolean('is_hidden')->default(false)->index();
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('from_backlog');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('active_days_count');
        });

        Schema::table('achievements', function (Blueprint $table) {
            $table->dropColumn('is_hidden');
        });
    }
};
