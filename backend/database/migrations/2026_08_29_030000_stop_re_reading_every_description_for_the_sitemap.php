<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The sitemap was the most expensive thing on this database.
 *
 * Measured over eleven days: 5,454 seconds in the query that counts and reads
 * indexable games, and 4,570 more in the paginated walk behind it — together
 * about 2.8 hours of database time, more than everything else combined.
 *
 * The reason is `Game::indexable()`, which asks whether a description still has
 * fifty characters left once its markup is stripped. That is the right rule —
 * a page with six words of boilerplate does not belong in a sitemap — but
 * written as a WHERE clause it means running a regular expression over 305,581
 * descriptions, and the content sitemap runs every fifteen minutes.
 *
 * A partial index whose predicate is that exact expression moves the work to
 * write time, where it belongs: Postgres evaluates the rule once when a game is
 * saved, and the sitemap then reads a list. `slug` is the sort key the walk
 * already uses and `updated_at` is the only other column it reads, so the whole
 * query can be answered from the index without touching the table.
 *
 * Predicates have to be immutable, which regexp_replace and length both are.
 * The expression is copied from Game::scopeIndexable and has to stay identical
 * to it — a predicate that differs by a space is a predicate Postgres will not
 * match to the query, and the index silently stops being used.
 */
return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block.
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS games_indexable_slug_idx
            ON games (slug) INCLUDE (updated_at)
            WHERE description IS NOT NULL
              AND length(regexp_replace(description, '<[^>]+>', '', 'g')) > 50");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS games_indexable_slug_idx');
    }
};
