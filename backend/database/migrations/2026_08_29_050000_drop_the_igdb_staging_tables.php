<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The import is finished, so its scaffolding comes down.
 *
 * `igdb_raw` held IGDB's API responses verbatim — 8,163,837 rows across 39
 * endpoints, pulled on 20–21 August — and `igdb_game_keys` the matching table
 * built from them. Between them they were 3.9 GB, 65% of the database, and
 * nothing on the site read either one: no controller, no observer, no scheduled
 * task. The migration that created `igdb_raw` said this in advance — "when the
 * import is finished and the data lives in `games`, this table is dropped
 * whole".
 *
 * Verified before dropping, because the source outliving its product is the
 * only order that is safe: 332,455 games, 262,576 IGDB external ids, 57,630
 * studios carrying an igdb_id, 566,915 game links, 85,368 relations and 285,850
 * game↔studio rows are all in permanent tables.
 *
 * The raw pull is not thrown away, only taken out of the live database:
 *
 *     /var/backups/igdb-archive/igdb-staging-2026-08-29.dump    (490 MB, -Fc)
 *
 * That file restores both tables whole. The tooling that read them — eleven
 * `igdb:*` commands, the client, the matcher and the facts service — is removed
 * in the same commit, since neither half works without the other; `git show` of
 * this commit brings it back if the two are ever wanted together again.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('igdb_game_keys');
        Schema::dropIfExists('igdb_raw');

        // 3.9 GB does not return to the filesystem on its own: a dropped table
        // frees its pages, but the space sits inside the tablespace until
        // something reclaims it. Cheap here — the files are being unlinked
        // anyway, so this only tidies the catalogue afterwards.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ANALYZE');
        }
    }

    /**
     * Not reversed here.
     *
     * Recreating two empty tables would claim a rollback that did not happen —
     * what mattered was the eight million rows, and those live in the archive
     * named above. Restoring is `pg_restore -d techplay <that file>`, which
     * brings the structure with it.
     */
    public function down(): void
    {
        // Intentionally empty. See the note above.
    }
};
