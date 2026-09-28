<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "What is this material used for" — asked 13,000 times by a crawler.
 *
 * The public recipe pages answer it with a containment query over
 * `gw2_recipes.ingredients`, and without an index that is a sequential scan.
 * Measured on production: 9.2 ms a call. One page is fine; the thirteen
 * thousand pages this section publishes are two full minutes of database time
 * on a cold crawl, spent entirely on a question an index answers instantly.
 *
 * `jsonb_path_ops` rather than the default: it indexes only the paths, which is
 * exactly and only what `@>` needs, and it builds a smaller index than the
 * general operator class whose extra capabilities nothing here uses.
 *
 * Concurrently, because the catalogue is read by every signed-in dashboard that
 * draws a crafting plan.
 */
return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // The suite runs on SQLite, which has neither jsonb nor a table
            // large enough for this to matter.
            return;
        }

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS gw2_recipes_ingredients_gin ON gw2_recipes USING gin (ingredients jsonb_path_ops)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS gw2_recipes_ingredients_gin');
    }
};
