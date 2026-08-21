<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A relation anchored on our game, describing whatever is on the other side.
 *
 * The first shape required both games to be in the catalogue, and that turned
 * out to be the wrong constraint: every IGDB game that names a parent is a
 * type this catalogue deliberately does not import — DLC, mods, packs, ports.
 * 17,580 pieces of DLC exist for games we hold, and none of them could be
 * written down, so a game's page could not list its own add-ons.
 *
 * Now the other side is a name, and a link only when we happen to have it.
 * Hades lists its soundtrack whether or not the soundtrack has a page, which
 * is what a reader wanted; it just is not clickable when there is nowhere to
 * click to.
 *
 * The row is also written from each side rather than once for both. Those are
 * two different statements — "this is DLC for Hades" and "Hades has this DLC" —
 * and only one of them can exist when one of the games is missing. It also
 * makes the page's query the whole story: `where game_id = ?`.
 *
 * The table holds nothing but derived data, so this replaces it rather than
 * migrating it; `igdb:relations` fills it again in about two minutes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('game_relations');

        Schema::create('game_relations', function (Blueprint $table) {
            $table->id();

            /* Ours, always — this is the page the row appears on. */
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            /* Read from `game_id`'s side: `dlc_of` on the add-on's page,
               `has_dlc` on the game's. */
            $table->string('relation', 24);

            /* The other side. The id is what makes a row unique, because the
               name is not: a game can have four things called "Soundtrack". */
            $table->unsignedBigInteger('other_igdb_id');
            $table->string('other_name', 500);
            $table->foreignId('other_game_id')->nullable()->constrained('games')->nullOnDelete();

            $table->timestamps();

            $table->unique(['game_id', 'relation', 'other_igdb_id']);
            $table->index(['game_id', 'relation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_relations');

        Schema::create('game_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('related_game_id')->constrained('games')->cascadeOnDelete();
            $table->string('relation', 20);
            $table->timestamps();

            $table->unique(['game_id', 'related_game_id', 'relation']);
            $table->index(['related_game_id', 'relation']);
        });
    }
};
