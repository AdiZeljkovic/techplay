<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Searching 74,265 items by name.
 *
 * The crafting planner cannot guess a target. An ascended set comes in a stat
 * prefix and an armour weight, and nothing in the API says which one somebody
 * wants — so the player names the item, and naming it means searching for it.
 *
 * A trigram index rather than a prefix one, for the same reason the game
 * catalogue has one: people search for the distinctive word, not the first word.
 * "damask" should find "Bolt of Damask", and a `name LIKE 'damask%'` index
 * cannot answer that, so it would read all 74,265 rows instead.
 *
 * Created concurrently. This table is read by every dashboard that draws a
 * character's gear, and a plain CREATE INDEX takes a write lock for the duration.
 */
return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // SQLite runs the test suite and has neither the extension nor a
            // need for the index; 74k rows is a production-only problem.
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS gw2_items_name_trgm_gin ON gw2_items USING gin (name gin_trgm_ops)');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS gw2_items_lower_name_idx ON gw2_items (lower(name))');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        Schema::table('gw2_items', function () {
            DB::statement('DROP INDEX CONCURRENTLY IF EXISTS gw2_items_name_trgm_gin');
            DB::statement('DROP INDEX CONCURRENTLY IF EXISTS gw2_items_lower_name_idx');
        });
    }
};
