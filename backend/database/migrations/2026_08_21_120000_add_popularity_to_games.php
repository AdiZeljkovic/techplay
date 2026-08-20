<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Real popularity, beside the estimate.
 *
 * `hype_score` is this codebase's own guess — 40 points per store that lists a
 * game, 2 per screenshot, 15 for having a trailer. It was the best available
 * answer when the only thing we knew about a game was how completely its store
 * page was filled in, and it orders the release calendar, the games hub, the
 * dashboard and the home page's Discover rail.
 *
 * IGDB carries what people actually did: Steam's 24-hour peak players, its
 * most-wishlisted-upcoming ranking, IGDB's own visits and want-to-play counts,
 * Twitch hours watched. 152,092 of our 332,128 games have at least one, and for
 * upcoming releases — the case `hype_score` exists for — the coverage is 4,421
 * of 4,540.
 *
 * Three columns rather than one number:
 *
 *   popularity         0-100, the game's percentile *within its measure*. Raw
 *                      values are not comparable across measures: peak players
 *                      tops out at 0.19 and hours watched at 0.26, and mixing
 *                      them would rank by whichever happens to be larger.
 *   popularity_metric  which measure that was. A number nobody can name is a
 *                      number nobody can check.
 *   popularity_raw     the value itself, for the game page to print.
 *
 * `hype_score` stays. Popularity covers 46% of the catalogue and none of the
 * store listings IGDB has never heard of, so it remains the fallback — the
 * ordering prefers a real number and settles for the estimate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedTinyInteger('popularity')->nullable();
            $table->string('popularity_metric', 40)->nullable();
            $table->double('popularity_raw')->nullable();
        });

        /* Every use of this column is "order by it, descending, and stop at
           twenty" — so the index is on the value with the nulls left out. */
        Schema::table('games', function (Blueprint $table) {
            $table->index('popularity');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['popularity']);
            $table->dropColumn(['popularity', 'popularity_metric', 'popularity_raw']);
        });
    }
};
