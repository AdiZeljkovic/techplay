<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wow_analyses', function (Blueprint $table) {
            $table->id();

            // Character identifiers
            $table->string('character_name', 12);
            $table->string('realm_slug', 50);
            $table->string('region', 2); // us, eu, kr, tw

            // Character info
            $table->string('class', 50);
            $table->string('race', 50);
            $table->string('faction', 20);
            $table->unsignedTinyInteger('level');
            $table->unsignedInteger('achievement_points')->default(0);

            // Analysis results
            $table->unsignedTinyInteger('readiness_score'); // 0-100
            $table->json('ai_advice'); // Array of recommendations
            $table->json('missing_essentials'); // Array of missing items
            $table->unsignedSmallInteger('void_mounts_count')->default(0);
            $table->boolean('has_void_elf')->default(false);

            // Media
            $table->string('portrait_url', 500)->nullable();

            // Analytics fields
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('share_count')->default(0);

            // Timestamps
            $table->timestamps();

            // Indexes for performance
            $table->index(['region', 'realm_slug', 'character_name'], 'character_lookup');
            $table->index(['readiness_score', 'created_at'], 'leaderboard_lookup');
            $table->index('created_at', 'recent_analyses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wow_analyses');
    }
};
