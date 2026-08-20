<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Popularity in basis points rather than percent.
 *
 * A percentile has a hundred steps, and the top one held 470 games. Ordering
 * the catalogue by it meant twenty-three pages of results all sitting in the
 * same bucket, arranged by the tie-break — so "Most Popular" was, for everyone
 * who ever scrolled it, a list of what gets read on this site, with IGDB's
 * measurement contributing nothing to the order.
 *
 * Ten thousand steps instead of a hundred puts about eight games in the top
 * bucket of the largest measure. The column carries the fine number; the API
 * still hands out a percentile, because 9,984 is not something to print next
 * to a game.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['popularity']);
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('popularity');
        });

        Schema::table('games', function (Blueprint $table) {
            $table->unsignedSmallInteger('popularity')->nullable()->after('popularity_raw');
            $table->index('popularity');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['popularity']);
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('popularity');
        });

        Schema::table('games', function (Blueprint $table) {
            $table->unsignedTinyInteger('popularity')->nullable();
            $table->index('popularity');
        });
    }
};
