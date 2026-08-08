<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The indexes the hot paths were missing.
 *
 * Two families here. First, the ranking columns: `users.xp` and
 * `users.forum_reputation` carry every leaderboard query and neither had an
 * index in 205 migrations, so each board was a sequential scan plus a sort of
 * the whole table.
 *
 * Second, foreign keys. Postgres — unlike MySQL — does not index a foreign key
 * for you. That costs twice: lookups from the child side scan, and every
 * DELETE on the parent scans each referencing table once per deleted row to
 * enforce the constraint. With the purge commands deleting games in the
 * thousands, that is the difference between minutes and hours.
 *
 * Postgres only: SQLite (used by the test suite) creates these differently and
 * does not need them at this size.
 */
return new class extends Migration
{
    /** table => [[column(s), index name], ...] */
    private const FK_INDEXES = [
        'presences' => [['game_id', 'presences_game_id_idx']],
        'player_signals' => [['game_id', 'player_signals_game_id_idx']],
        'user_games' => [['game_id', 'user_games_game_id_idx']],
        'game_list_items' => [['game_id', 'game_list_items_game_id_idx']],
        'steam_achievements' => [['game_id', 'steam_achievements_game_id_idx']],
        'threads' => [['game_id', 'threads_game_id_idx']],
        'guides' => [['game_id', 'guides_game_id_idx']],
        'play_sessions' => [['game_id', 'play_sessions_game_id_idx']],
        'game_ratings' => [['game_id', 'game_ratings_game_id_idx']],
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Ranking: partial, because every board filters to public profiles.
        if (Schema::hasTable('users')) {
            if (Schema::hasColumn('users', 'xp') && Schema::hasColumn('users', 'profile_visibility')) {
                DB::statement("CREATE INDEX IF NOT EXISTS users_xp_public_idx ON users (xp DESC) WHERE profile_visibility = 'public'");
            }
            if (Schema::hasColumn('users', 'forum_reputation') && Schema::hasColumn('users', 'profile_visibility')) {
                DB::statement("CREATE INDEX IF NOT EXISTS users_reputation_public_idx ON users (forum_reputation DESC) WHERE profile_visibility = 'public'");
            }
        }

        foreach (self::FK_INDEXES as $table => $indexes) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($indexes as [$column, $name]) {
                if (Schema::hasColumn($table, $column)) {
                    DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$table} ({$column})");
                }
            }
        }

        // The view-tracking tables are pruned daily by created_at, which was
        // unindexed — so the cleanup scanned the whole table every night.
        foreach (['article_views', 'guide_views', 'review_views'] as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'created_at')) {
                DB::statement("CREATE INDEX IF NOT EXISTS {$table}_created_at_idx ON {$table} (created_at)");
            }
        }

        // games.slug carried both a unique constraint and a plain index; the
        // plain one can never be preferred over the unique and taxes writes.
        DB::statement('DROP INDEX IF EXISTS games_slug_index');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS users_xp_public_idx');
        DB::statement('DROP INDEX IF EXISTS users_reputation_public_idx');

        foreach (self::FK_INDEXES as $indexes) {
            foreach ($indexes as [, $name]) {
                DB::statement("DROP INDEX IF EXISTS {$name}");
            }
        }

        foreach (['article_views', 'guide_views', 'review_views'] as $table) {
            DB::statement("DROP INDEX IF EXISTS {$table}_created_at_idx");
        }
    }
};
