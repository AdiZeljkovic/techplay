<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `sync_status` could not hold the one value PlayStation needs it to.
 *
 * The column was created as an enum of idle/pending/syncing/done/error, and
 * `SyncPlayStationLibrary` writes `expired` when a refresh token ages out —
 * a write the CHECK constraint rejects, so the job would have died there and
 * left the account stuck reading `syncing` for ever. The settings screen even
 * draws a "Connection expired — reconnect" badge for a state the database
 * refuses to store. Nobody has been bitten only because no PlayStation account
 * has been linked yet.
 *
 * It becomes a plain string rather than a wider enum, which is what
 * `user_games.status` already is: the set of values lives in PHP, next to the
 * code that assigns them, and adding one is a deploy rather than a migration
 * plus a production constraint that has to agree with it.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            // Laravel's enum() on Postgres is a varchar plus this check.
            DB::statement('ALTER TABLE connected_accounts DROP CONSTRAINT IF EXISTS connected_accounts_sync_status_check');

            return;
        }

        // SQLite carries the constraint in the table definition, so the column
        // has to be redeclared; Laravel rebuilds the table to do it.
        Schema::table('connected_accounts', function ($table) {
            $table->string('sync_status')->default('idle')->change();
        });
    }

    public function down(): void
    {
        // Anything already stored outside the original set would fail the
        // restored constraint, so it is settled first.
        DB::table('connected_accounts')
            ->whereNotIn('sync_status', ['idle', 'pending', 'syncing', 'done', 'error'])
            ->update(['sync_status' => 'error']);

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE connected_accounts ADD CONSTRAINT connected_accounts_sync_status_check CHECK (sync_status::text = ANY (ARRAY['idle','pending','syncing','done','error']::text[]))");
        }
    }
};
