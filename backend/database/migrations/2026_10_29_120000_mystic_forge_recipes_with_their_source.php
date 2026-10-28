<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mystic Forge recipes — the one part of a legendary the API does not have.
 *
 * `/v2/recipes` covers the crafting disciplines and nothing else, so every
 * Gift of Mastery, every Mystic Clover and the final four-ingredient forge of
 * every legendary weapon is missing from it. Every planner that shows them
 * gets them from somewhere else; this table is where ours come from.
 *
 * A recipe is used only with a source and a `checked_at`. One without either
 * is not shown at all, because a legendary is a month of somebody's play, and
 * a wrong ingredient discovered at the forge is the worst thing a planner can
 * do to them.
 *
 * The table ships empty. How it is filled — by hand, or from an open dataset
 * whose licence the owner has accepted — is an editorial decision, not a
 * migration's.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_forge_recipes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('output_item_id')->index();

            /*
             * Usually 1. Some forge recipes are random — a Mystic Clover comes
             * out of roughly a third of attempts — and the planner then plans
             * in attempts and says the result is an average.
             */
            $table->decimal('output_count', 8, 3)->default(1);

            // Four entries, each {type: Item|Currency, id, count}.
            $table->jsonb('ingredients');

            $table->string('source_url', 500)->nullable();
            $table->string('source_label', 200)->nullable();
            $table->timestamp('checked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_forge_recipes');
    }
};
