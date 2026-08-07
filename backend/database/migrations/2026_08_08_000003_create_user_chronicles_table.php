<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The chronicle: one internal row per user where everything the site knows
 * about a gamer's taste is condensed. Built by ChronicleBuilder from the
 * tables that already exist (collection, ratings, sessions, reads,
 * bookmarks) — this is the summary, never the source of truth. It is not
 * exposed through any public API; the user only ever sees its effects.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_chronicles', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->json('taste')->nullable();            // genres/platforms/eras/tags → weight
            $table->json('game_affinities')->nullable();  // top 50 game_id → weight
            $table->json('negative')->nullable();         // what they bounced off — also learning
            $table->json('peer_ids')->nullable();         // 20 most similar users, cached
            $table->unsignedInteger('signals_count')->default(0);
            $table->timestamp('last_signal_at')->nullable();
            $table->timestamp('built_at')->nullable();
            $table->unsignedSmallInteger('version')->default(1);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_chronicles');
    }
};
