<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where deleted games leave their slug.
 *
 * The adult purge removes ~13k rows whose pages Google has indexed. A vanished
 * page answers 404 — "maybe temporary" — for months; a tombstone lets the API
 * answer 410, which is "gone on purpose", and crawlers drop it far faster.
 * The row also records why, so a future "where did X go" has an answer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_tombstones', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('reason', 64);
            $table->timestamp('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_tombstones');
    }
};
