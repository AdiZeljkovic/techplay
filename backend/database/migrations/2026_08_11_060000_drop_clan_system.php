<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Removes the clan system.
 *
 * The feature is gone from the code; this takes its schema with it rather than
 * leaving fifteen tables nothing reads. Two columns outside those tables point
 * at clans and have to go first, or the drop fails on the foreign keys:
 * `categories.clan_id` (private clan forums) and `conversations.clan_id`
 * (clan chat rooms).
 *
 * `categories.is_private` deliberately stays. Those categories were private
 * when they were written, and ForumController now hides them from everyone
 * rather than publishing them to everyone — dropping the flag would do the
 * opposite. They can be deleted by hand from the admin panel.
 *
 * There is no down(). Reversing this would recreate empty tables and claim to
 * have restored something; the data is gone either way. Take a dump of the
 * clan tables before running it on production if any of it still matters.
 */
return new class extends Migration
{
    /** Children first — the order only matters on drivers without CASCADE. */
    private const TABLES = [
        'clan_poll_votes',
        'clan_polls',
        'clan_mission_progress',
        'clan_missions',
        'clan_mission_templates',
        'clan_projects',
        'clan_buildings',
        'clan_boosts',
        'clan_trophies',
        'clan_activities',
        'clan_applications',
        'clan_invites',
        'clan_ledger',
        'clan_members',
        'clans',
    ];

    public function up(): void
    {
        if (Schema::hasColumn('categories', 'clan_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropConstrainedForeignId('clan_id');
            });
        }

        if (Schema::hasTable('conversations')) {
            // The rooms go with the clans that owned them. Participants and
            // messages cascade from the conversation's own foreign keys.
            DB::table('conversations')->where('type', 'clan')->delete();

            if (Schema::hasColumn('conversations', 'clan_id')) {
                // One clan, one room — the column carries a unique index.
                // Postgres drops it along with the column; SQLite refuses to
                // drop a column an index still names, so it goes first.
                if (Schema::hasIndex('conversations', 'conversations_clan_id_unique')) {
                    Schema::table('conversations', function (Blueprint $table) {
                        $table->dropUnique('conversations_clan_id_unique');
                    });
                }

                Schema::table('conversations', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('clan_id');
                });
            }
        }

        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            // Postgres refuses while anything still references the table, and
            // a stray view or constraint from an older migration would stop
            // the whole deploy. CASCADE takes the dependents with it.
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("DROP TABLE IF EXISTS {$table} CASCADE");
            } else {
                Schema::dropIfExists($table);
            }
        }
    }
};
