<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_external_ids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            // Provider: steam | igdb | rawg | gog | epic | xbox | psn
            $table->string('provider', 32)->index();

            // The external identifier (Steam AppID, IGDB ID, etc.)
            $table->string('external_id', 64);

            // Optional: store extra metadata (e.g. store URL, thumbnail)
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->unique(['provider', 'external_id']);
            $table->index(['game_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_external_ids');
    }
};
