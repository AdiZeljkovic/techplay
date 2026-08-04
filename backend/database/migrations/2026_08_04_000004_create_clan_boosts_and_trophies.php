<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 5: boosters (officer-activated, time-limited multipliers) and
 * trophies (the clan's permanent record — written when things happen,
 * never derived retroactively). docs/33-clan-system-plan.md §6, §3.7.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clan_boosts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->string('key', 32);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['clan_id', 'ends_at']);
        });

        Schema::create('clan_trophies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->string('key', 48); // season_champion_1 | season_best_small | …
            $table->string('title', 120);
            $table->string('description', 300)->nullable();
            $table->foreignId('season_id')->nullable()->constrained()->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamp('awarded_at');
            $table->timestamps();

            $table->index(['clan_id', 'awarded_at']);
            // One trophy of a kind per season per clan — settlement stays idempotent.
            $table->unique(['clan_id', 'key', 'season_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_trophies');
        Schema::dropIfExists('clan_boosts');
    }
};
