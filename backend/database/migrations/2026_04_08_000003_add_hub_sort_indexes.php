<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // CONCURRENTLY + partial NULLS LAST indexes are Postgres-only, perf-only
        }

        // Partial indexes covering only has_description=true rows (~766k of 889k)
        // PostgreSQL can combine these with GIN array indexes via bitmap AND
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_hub_rating_idx
            ON games (rating DESC NULLS LAST) WHERE has_description = true');

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_hub_metacritic_idx
            ON games (metacritic DESC NULLS LAST) WHERE has_description = true');

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_hub_released_idx
            ON games (released DESC NULLS LAST) WHERE has_description = true');

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_hub_name_idx
            ON games (name ASC) WHERE has_description = true');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_hub_rating_idx');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_hub_metacritic_idx');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_hub_released_idx');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_hub_name_idx');
    }
};
