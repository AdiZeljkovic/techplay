<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Five achievements the reader picks, from any source they have.
 *
 * The profile has shown "the five most recent unlocks" — which is a sorting,
 * not a choice. What somebody is proud of is rarely what they happened to
 * unlock last, and the shelf is the one place on a profile where the owner
 * should be doing the talking.
 *
 * One table rather than a pin column on each source, because a slot has to be
 * able to hold a TechPlay achievement today and a Steam one beside it, with
 * PlayStation trophies joining later without another migration. `source` plus
 * `reference` is deliberately loose: the row points at whatever that source
 * calls its own key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trophy_case_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // 'techplay' | 'steam' — 'psn' and 'xbox' land here as they arrive.
            $table->string('source', 16);

            // The source's own identifier: our achievement id, or the
            // steam_achievements row id.
            $table->unsignedBigInteger('reference');

            // 0–4. Position is the whole point — a case is an arrangement.
            $table->unsignedTinyInteger('position');

            $table->timestamps();

            // One achievement can occupy one slot, and one slot holds one thing.
            $table->unique(['user_id', 'source', 'reference']);
            $table->unique(['user_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trophy_case_slots');
    }
};
