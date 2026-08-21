<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a game can be bought, where it lives online, and what it is part of.
 *
 * **This deliberately does not touch `game_store_links`.** That table is the
 * release aggregator's own record — `Notability` scores forty points per
 * distinct store on it and `CalendarVisibility` admits games to the calendar by
 * counting its rows. Writing IGDB's 174,099 Steam links into it would move the
 * release calendar and every hype score on the site sideways, silently, as a
 * side effect of adding buy buttons. Its columns mean something to the
 * aggregator too — `last_synced_at`, `rejected_reason` — that IGDB has no
 * answer for.
 *
 * So links from IGDB get their own table, read by the game page and by nothing
 * else. The aggregator keeps its table and its meaning.
 *
 * `game_relations` is the other half: 54,783 games have a parent they cannot
 * point at today, so a DLC page does not know its game and a remaster does not
 * know its original.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            /* store — somewhere to buy it; social — where its people are;
               reference — a database or wiki entry. The page shows the first
               two and keeps the third for structured data. */
            $table->string('kind', 12);

            /* "Steam", "GOG", "Discord" — the name a reader recognises, not a
               source id. One row per service per game. */
            $table->string('service', 40);
            $table->string('url', 700);

            $table->timestamps();

            $table->unique(['game_id', 'service']);
            $table->index(['game_id', 'kind']);
        });

        Schema::create('game_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('related_game_id')->constrained('games')->cascadeOnDelete();

            /* Read as "<game> is the <relation> of <related>": a DLC row says
               dlc_of, a remaster says remaster_of. One direction only, written
               from whichever side IGDB states it — the reverse is a query, not
               a second row that can disagree with the first. */
            $table->string('relation', 20);

            $table->timestamps();

            $table->unique(['game_id', 'related_game_id', 'relation']);
            $table->index(['related_game_id', 'relation']);
        });

        Schema::table('games', function (Blueprint $table) {
            $table->text('engines')->nullable();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            Schema::getConnection()->statement("
                alter table games
                    alter column engines type text[] using case when engines is null then null else engines::text[] end,
                    alter column engines set default '{}'
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('game_relations');
        Schema::dropIfExists('game_links');

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('engines');
        });
    }
};
