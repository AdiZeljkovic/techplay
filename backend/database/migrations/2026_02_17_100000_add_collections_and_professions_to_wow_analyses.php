<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add Collections and Professions columns to wow_analyses table
     */
    public function up(): void
    {
        Schema::table('wow_analyses', function (Blueprint $table) {
            // Collections Data
            $table->smallInteger('pet_count')->default(0)->after('midnight_factions');
            $table->smallInteger('pet_unique')->default(0)->after('pet_count');
            $table->smallInteger('pet_max_level')->default(0)->after('pet_unique');
            $table->smallInteger('toy_count')->default(0)->after('pet_max_level');
            $table->smallInteger('transmog_slots')->default(0)->after('toy_count');
            $table->smallInteger('transmog_appearances')->default(0)->after('transmog_slots');

            // Professions (JSON structure for flexibility)
            $table->json('professions')->nullable()->after('transmog_appearances');

            // Indexes for leaderboards
            $table->index('pet_unique', 'pet_leaderboard');
            $table->index('toy_count', 'toy_leaderboard');
            $table->index('transmog_appearances', 'transmog_leaderboard');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('wow_analyses', function (Blueprint $table) {
            $table->dropIndex('pet_leaderboard');
            $table->dropIndex('toy_leaderboard');
            $table->dropIndex('transmog_leaderboard');

            $table->dropColumn([
                'pet_count',
                'pet_unique',
                'pet_max_level',
                'toy_count',
                'transmog_slots',
                'transmog_appearances',
                'professions',
            ]);
        });
    }
};
