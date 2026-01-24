<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('giveaway_prize_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giveaway_id')->constrained()->cascadeOnDelete();
            $table->string('tier_name'); // e.g., "Grand Prize", "Silver Prize", "Bronze Prize"
            $table->text('prize_description')->nullable(); // Description of this tier's prize
            $table->integer('winner_count')->default(1); // Number of winners for this tier
            $table->integer('min_points')->default(0); // Minimum points required to qualify
            $table->integer('sort_order')->default(0); // Display order (lower = higher tier)
            $table->timestamps();

            $table->index(['giveaway_id', 'sort_order']);
        });

        // Junction table for tier winners
        Schema::create('giveaway_tier_winners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prize_tier_id')->constrained('giveaway_prize_tiers')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('selected_at')->useCurrent();

            $table->unique(['prize_tier_id', 'user_id']);
            $table->index('prize_tier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('giveaway_tier_winners');
        Schema::dropIfExists('giveaway_prize_tiers');
    }
};
