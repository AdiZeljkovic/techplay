<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two indexes that should exist, six that should not.
 *
 * Both halves came out of the same structural query over `pg_constraint` and
 * `pg_index` rather than from reading migrations — which is the only way to see
 * this, because several of these were created by migrations that wrapped their
 * CREATE in a try/catch and the file is therefore not proof of what exists.
 *
 * ── The two that go in ────────────────────────────────────────────────────
 *
 * A foreign key with no index on the child column means every delete of a
 * parent row sequentially scans the child table to check the constraint.
 * Fifteen such keys exist; thirteen are on tables of 8–280 KB where a scan is
 * cheaper than an index, and they are deliberately left alone. These two are
 * not:
 *
 *   studios.became_studio_id  → studios        (25 MB)
 *   game_relations.other_game_id → games       (10 MB)
 *
 * `PurgeClutterGames` and `PurgeAdultGames` delete in batches of a thousand,
 * and each one of those pays the walk through `game_relations`.
 *
 * ── The six that come out ─────────────────────────────────────────────────
 *
 * Each is a plain index sitting on exactly the columns of a unique index on the
 * same table. The unique one answers everything the plain one did and cannot be
 * dropped — it is the constraint. The space is trivial, about 176 KB in total;
 * the cost is that every insert into `users` and `article_reads` maintains two
 * identical structures for one purpose.
 *
 * The earlier dedup (2026_08_29_040000) listed its pairs by hand and only
 * caught identical-to-identical. These are plain-shadowing-unique, which that
 * pass did not model.
 */
return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block.
    public $withinTransaction = false;

    /** index name => table(columns) */
    private const MISSING = [
        'studios_became_studio_id_idx' => 'studios (became_studio_id)',
        'game_relations_other_game_id_idx' => 'game_relations (other_game_id)',
    ];

    /** Plain indexes whose unique twin stays. */
    private const SHADOWS = [
        'threads_slug_index',                       // threads_slug_unique stays
        'redirects_source_url_index',               // redirects_source_url_unique
        'article_reads_user_article_index',         // article_reads_user_id_article_id_unique
        'users_battlenet_id_index',                 // users_battlenet_id_unique
        'seo_metas_seoable_type_seoable_id_index',  // ..._unique
        'idx_daily_task_check',                     // unique_task_per_day
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::MISSING as $name => $target) {
            DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS {$name} ON {$target}");
        }

        foreach (self::SHADOWS as $name) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$name}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Only the additions are reversed. Recreating the six would restore the
        // duplication this exists to remove, and every one of them has a living
        // twin — there is nothing to roll back to.
        foreach (array_keys(self::MISSING) as $name) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$name}");
        }
    }
};
