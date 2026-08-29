<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Three changes, each one measured on production rather than guessed at.
 *
 * 1. `studios.parent_id` had no index at all, and the studio page asks for a
 *    studio's subsidiaries on every render: 234,079 calls at 10 ms each —
 *    2,345 seconds of database time — every one of them a sequential scan of
 *    57,630 rows. It was a third of all sequential scans on the server.
 *
 * 2. `lower(games.name)` is how a storefront title is matched to a catalogue
 *    row: PresenceService resolves it for every player every two minutes, and
 *    GameMatchingService for every title that misses the external-id table
 *    during a library import. Each one was a sequential scan of 332,455 rows —
 *    EXPLAIN put it at cost 146,667.
 *
 * 3. `games_hub_name_idx` has recorded zero scans in every measurement taken:
 *    the weekly snapshots of 17 and 24 August, and again today. It was built
 *    for a hub that filtered on `description IS NOT NULL`, and the hub stopped
 *    doing that when the catalogue was rebuilt. 23 MB, plus its share of every
 *    write to the games table. Its two siblings are still used (rating 58
 *    scans, released 2,017) and stay.
 *
 * CONCURRENTLY throughout: `games` is the busiest table on the site and a plain
 * CREATE INDEX takes a lock that would stop reads for the duration.
 */
return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block.
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // Functional and concurrent indexes are Postgres-only, and none of
            // this changes behaviour — it only changes how long it takes.
            return;
        }

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS studios_parent_id_idx
            ON studios (parent_id) WHERE parent_id IS NOT NULL');

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_lower_name_idx
            ON games (lower(name))');

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_hub_name_idx');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS studios_parent_id_idx');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_lower_name_idx');

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS games_hub_name_idx
            ON games (name) WHERE description IS NOT NULL');
    }
};
