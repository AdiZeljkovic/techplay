<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `notifications.data` becomes jsonb, so it can actually be queried.
 *
 * Laravel's stock notifications migration makes this column `text`. That is
 * fine until something asks a question about what is inside it — and
 * `CheckWishlistReleases` does, twice:
 *
 *     ->whereJsonContains('data->type', $notifType)
 *     ->whereJsonContains('data->game_slug', $entry->game->slug)
 *
 * On PostgreSQL that compiles to the `->` operator, which text does not have.
 * The command is scheduled every day at 09:00 and has been failing on that line
 * every time, which means nobody with a wishlisted game has ever been told it
 * released. Nothing surfaced it: the failure is caught by the scheduler's
 * onFailure handler and written to a log file.
 *
 * Changing the column type is the fix rather than rewriting the two queries
 * with a raw cast, because `text` is simply the wrong type for a column the
 * application stores JSON in and reads JSON out of — and a raw `data::jsonb`
 * would have to be repeated at every future call site, each one a chance to
 * forget.
 *
 * Checked before writing this: 155 rows, none of them anything but JSON.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notifications')) {
            return;
        }

        // Postgres only. SQLite has no column types worth converting and MySQL
        // already stores this as json in recent Laravel versions.
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE jsonb USING data::jsonb');
    }

    public function down(): void
    {
        if (! Schema::hasTable('notifications') || DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE text USING data::text');
    }
};
