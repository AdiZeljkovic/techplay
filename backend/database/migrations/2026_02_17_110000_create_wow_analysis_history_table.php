<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create wow_analysis_history table for tracking character progression over time
     */
    public function up(): void
    {
        Schema::create('wow_analysis_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wow_analysis_id')->index(); // FK to wow_analyses
            $table->string('character_name', 12)->index();
            $table->string('realm_slug', 50);
            $table->string('region', 2); // us, eu, kr, tw

            // Snapshot data (key metrics for charts)
            $table->smallInteger('item_level')->nullable();
            $table->smallInteger('mythic_plus_score')->nullable();
            $table->smallInteger('arena_rating')->nullable(); // Highest of 2v2/3v3/RBG
            $table->smallInteger('readiness_score')->nullable();
            $table->smallInteger('pet_count')->default(0);
            $table->smallInteger('toy_count')->default(0);
            $table->tinyInteger('exalted_reps')->default(0);

            // Timestamps
            $table->timestamp('analyzed_at')->useCurrent(); // When this snapshot was taken
            $table->timestamps(); // created_at, updated_at

            // Foreign key
            $table->foreign('wow_analysis_id')
                ->references('id')
                ->on('wow_analyses')
                ->onDelete('cascade');

            // Indexes for queries
            $table->index(['character_name', 'realm_slug', 'region'], 'character_composite');
            $table->index('analyzed_at', 'date_index');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('wow_analysis_history');
    }
};
