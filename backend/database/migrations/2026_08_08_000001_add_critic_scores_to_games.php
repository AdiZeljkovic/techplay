<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One home for critic scores, per source:
 *
 *   { "opencritic": { "score": 87, "tier": "Mighty", "url": "..." },
 *     "metacritic": { "score": 84, "url": "..." } }
 *
 * Deliberately not a resurrection of the old `metacritic` integer — that
 * column was zero on every row and welded to one source. Sources here are
 * Steam's appdetails (which carries licensed Metacritic data), the
 * OpenCritic API, and the admin's own hands. The TechPlay score is NOT
 * stored: it is computed from our reviews and community ratings, and a
 * stored copy would only ever be stale.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->json('critic_scores')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('critic_scores');
        });
    }
};
