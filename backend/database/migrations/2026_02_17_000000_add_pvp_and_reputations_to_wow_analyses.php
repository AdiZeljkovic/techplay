<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add PvP and Reputations columns to wow_analyses table
     */
    public function up(): void
    {
        Schema::table('wow_analyses', function (Blueprint $table) {
            // PvP Data
            $table->smallInteger('honor_level')->nullable()->after('raid_kills');
            $table->smallInteger('arena_2v2')->nullable()->after('honor_level');
            $table->smallInteger('arena_3v3')->nullable()->after('arena_2v2');
            $table->smallInteger('rbg_rating')->nullable()->after('arena_3v3');

            // Reputations (Midnight critical)
            $table->smallInteger('exalted_reps')->default(0)->after('rbg_rating');
            $table->json('midnight_factions')->nullable()->after('exalted_reps');

            // Raider.IO Integration
            $table->smallInteger('rio_score')->nullable()->after('midnight_factions');
            $table->string('rio_color', 20)->nullable()->after('rio_score');
            $table->integer('world_rank')->nullable()->after('rio_color');
            $table->integer('region_rank')->nullable()->after('world_rank');
            $table->integer('realm_rank')->nullable()->after('region_rank');

            // Indexes for leaderboards
            $table->index('honor_level', 'honor_leaderboard');
            $table->index(['arena_2v2', 'arena_3v3'], 'pvp_leaderboard');
            $table->index('exalted_reps', 'rep_leaderboard');
            $table->index('rio_score', 'rio_leaderboard');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('wow_analyses', function (Blueprint $table) {
            $table->dropIndex('honor_leaderboard');
            $table->dropIndex('pvp_leaderboard');
            $table->dropIndex('rep_leaderboard');
            $table->dropIndex('rio_leaderboard');

            $table->dropColumn([
                'honor_level',
                'arena_2v2',
                'arena_3v3',
                'rbg_rating',
                'exalted_reps',
                'midnight_factions',
                'rio_score',
                'rio_color',
                'world_rank',
                'region_rank',
                'realm_rank',
            ]);
        });
    }
};
