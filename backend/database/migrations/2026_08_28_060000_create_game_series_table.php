<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per game series, so a series can have a URL.
 *
 * `games.series_key` and `games.series_name` already group the catalogue —
 * 9,611 series, 4,255 of them with three games or more — and the game page
 * already lists a title's siblings through /games/{slug}/series. What none of
 * that gives is an address for the series itself, which is what a search for
 * "Final Fantasy games" is looking for.
 *
 * The slug is stored rather than derived at request time, for two reasons.
 * `series_key` is a bare integer, so the URL has to come from the name; and
 * PostgreSQL's regex and PHP's Str::slug disagree on accents — "Pokémon"
 * becomes `pokemon` in one and `pok-mon` in the other — so a slug computed in
 * SQL would not match the slug the sitemap published. Computing it once, in
 * PHP, and storing it also means two series whose names slugify the same are
 * separated deterministically instead of racing for the URL.
 *
 * This is an index of something already in `games`, not a second source for it:
 * names and membership stay on the game rows and `games:sync-series` rebuilds
 * this table from them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_series', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('series_key')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('games_count')->default(0);
            $table->unsignedSmallInteger('first_year')->nullable();
            $table->unsignedSmallInteger('last_year')->nullable();
            // A series whose games all lack descriptions has nothing to show and
            // stays out of the sitemap; counted here so the check is one column.
            $table->unsignedInteger('described_count')->default(0);
            $table->timestamps();

            $table->index('games_count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_series');
    }
};
