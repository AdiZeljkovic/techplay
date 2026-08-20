<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The columns the rewritten game page is for.
 *
 * The page as it stands was written for what we had: a title, a genre, a
 * platform, some pictures. IGDB carries the things a reader actually asks about
 * a game and this table has nowhere to put them — how long it takes to finish,
 * whether it has split-screen, which languages it is dubbed into, what it is
 * like.
 *
 * `screenshots` and `age_ratings` already exist and keep their shapes: the game
 * page reads both straight out of the column, so a different shape here is a
 * blank gallery or a missing rating rather than a migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            /* Seconds, from IGDB: {hastily, normally, completely, count}. The
               page turns them into hours; storing hours would throw away the
               only precision the source has. */
            $table->jsonb('time_to_beat')->nullable();

            /* Single player, Co-operative, Battle Royale — text arrays like
               `genres` beside them, and queried the same way. */
            $table->text('game_modes')->nullable();
            $table->text('player_perspectives')->nullable();

            /* {onlinecoop, offlinecoop, splitscreen, campaigncoop, dropin,
               onlinemax, offlinemax} — booleans and two counts. */
            $table->jsonb('multiplayer')->nullable();

            /* [{name, audio, subtitles, interface}] — one row per language,
               three booleans, which is exactly the table the page draws. */
            $table->jsonb('languages')->nullable();

            /* Key art, kept apart from screenshots because they are different
               pictures for different purposes and the gallery shows them so. */
            $table->jsonb('artworks')->nullable();

            /* [{name, slug}] resolved to our own pages at import — an IGDB id
               here would be a link this site cannot follow. */
            $table->jsonb('similar_games')->nullable();
        });

        /* Postgres wants real arrays for the two text columns; SQLite, which
           the tests run on, has no array type and takes the literal as text. */
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            Schema::getConnection()->statement("
                alter table games
                    alter column game_modes type text[] using case when game_modes is null then null else game_modes::text[] end,
                    alter column game_modes set default '{}',
                    alter column player_perspectives type text[] using case when player_perspectives is null then null else player_perspectives::text[] end,
                    alter column player_perspectives set default '{}'
            ");
        }
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn([
                'time_to_beat', 'game_modes', 'player_perspectives',
                'multiplayer', 'languages', 'artworks', 'similar_games',
            ]);
        });
    }
};
