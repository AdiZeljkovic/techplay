<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The signals that would otherwise evaporate: searches, presence
 * sightings — day-level rollups, never raw pings. Everything the site
 * already persists (collection, ratings, reads) is NOT duplicated here;
 * the ChronicleBuilder reads those tables directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->nullable()->constrained('games')->nullOnDelete();
            $table->string('type', 32);
            $table->decimal('weight', 4, 2);
            $table->json('meta')->nullable();
            $table->date('day');
            $table->unique(['user_id', 'type', 'game_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_signals');
    }
};
