<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guides join the same spine articles already have: a nullable pointer at
 * the game they are about. The game page collects everything written
 * about a title through these two columns — one link model for all
 * content, not a second system.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->foreignId('game_id')->nullable()->constrained('games')->nullOnDelete();
            $table->index('game_id');
        });
    }

    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->dropConstrainedForeignId('game_id');
        });
    }
};
