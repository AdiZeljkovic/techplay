<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * game_ratings was keyed by an unconstrained game_slug string — renaming a
     * game's slug silently orphaned its ratings. Add a real FK and backfill.
     * game_slug is kept for now so existing queries keep working.
     */
    public function up(): void
    {
        Schema::table('game_ratings', function (Blueprint $table) {
            $table->foreignId('game_id')->nullable()->after('user_id')
                ->constrained('games')->nullOnDelete();
        });

        DB::statement('
            UPDATE game_ratings
            SET game_id = games.id
            FROM games
            WHERE games.slug = game_ratings.game_slug
              AND game_ratings.game_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('game_ratings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('game_id');
        });
    }
};
