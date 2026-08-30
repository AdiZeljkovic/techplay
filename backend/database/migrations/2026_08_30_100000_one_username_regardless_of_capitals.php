<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A username is one name, however it is capitalised.
 *
 * `users_username_unique` is a plain unique index, and in PostgreSQL that is
 * case-sensitive — so `XLBanana47` and `xlbanana47` were two different accounts
 * as far as the database was concerned. On 30.08.2026 that is exactly what
 * happened: a member with 1,895 XP connected Discord, `uniqueUsername()`
 * lowercased its candidate and then checked for a collision case-sensitively,
 * found none, and created a second account under what any reader would call the
 * same name.
 *
 * Two indexes, doing two jobs:
 *
 *   users_username_lower_idx     makes `lower(username) = ?` an index lookup,
 *                                which every profile route now does
 *   users_username_lower_unique  makes the collision impossible rather than
 *                                merely unlikely
 *
 * The unique one is built CONCURRENTLY and only after the data is checked: if
 * two accounts already differ by capitals alone, this stops with a readable
 * message rather than failing halfway through a deploy.
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

        $clashes = DB::table('users')
            ->selectRaw('lower(username) AS name, count(*) AS n')
            ->groupByRaw('lower(username)')
            ->havingRaw('count(*) > 1')
            ->pluck('name')
            ->all();

        if ($clashes !== []) {
            throw new RuntimeException(
                'Usernames differing only by capitals must be resolved before this can run: '
                .implode(', ', array_slice($clashes, 0, 10))
            );
        }

        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS users_username_lower_idx ON users (lower(username))');
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_username_lower_unique ON users (lower(username))');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS users_username_lower_unique');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS users_username_lower_idx');
    }
};
