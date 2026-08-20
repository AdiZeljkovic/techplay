<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where IGDB lands before it is allowed anywhere near `games`.
 *
 * One table, not the twenty-five their model would suggest. This is a staging
 * area for a copy of somebody else's database — about 5.7 million rows across
 * games, covers, screenshots, companies, release dates and the rest — and its
 * whole job is to hold what was downloaded so the merge can be written, run,
 * got wrong, and run again without pulling any of it a second time.
 *
 * Modelling it properly would mean a migration per endpoint and a schema that
 * has to track theirs. Keeping the payload as jsonb means the download is
 * decided once and the shape of the merge stays a question for the merge. When
 * the import is finished and the data lives in `games`, this table is dropped
 * whole.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('igdb_raw', function (Blueprint $table) {
            $table->id();

            /** Which of their endpoints this row came from — `games`, `companies`, … */
            $table->string('endpoint', 48);

            /** Their id. Unique per endpoint, and the only key the merge needs. */
            $table->unsignedBigInteger('igdb_id');

            $table->jsonb('payload');

            /**
             * When we fetched it. IGDB rows carry their own `updated_at`; this is
             * ours, so a re-pull can be told from a record they changed.
             */
            $table->timestampTz('fetched_at');

            /* Upserts key on this: a re-run replaces rather than duplicates. */
            $table->unique(['endpoint', 'igdb_id']);

            /* Every read during the merge is "all of one endpoint". */
            $table->index('endpoint');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('igdb_raw');
    }
};
