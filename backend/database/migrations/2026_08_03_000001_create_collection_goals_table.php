<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Self-set targets for the collection shelf. One row per goal type per user —
 * a goal is a number you're aiming at, not a log, so re-setting it overwrites
 * rather than accumulating. Progress is never stored: it's read live from the
 * collection, so a goal can't drift out of sync with the shelf it measures.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->unsignedInteger('target');
            $table->timestamps();

            $table->unique(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_goals');
    }
};
