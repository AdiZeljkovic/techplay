<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Recovers media the catalogue already owns but never surfaced.
 *
 * The Moby crawl stored every game's screenshot list in the payload blob
 * (`sample_screenshots`, measured at 61k games) but the screenshots column
 * was only ever filled for 16k. Same story for a handful of covers. This
 * promotes what exists — no external service is asked for anything.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // The test database starts empty; there is nothing to recover.
        }

        DB::statement(<<<'SQL'
            UPDATE games
            SET screenshots = import_payload::jsonb -> 'sample_screenshots'
            WHERE (screenshots IS NULL OR screenshots::text IN ('[]', 'null'))
              AND COALESCE(import_payload::jsonb -> 'sample_screenshots', '[]'::jsonb)
                  NOT IN ('[]'::jsonb, 'null'::jsonb)
        SQL);

        // The payload nests covers one level deep: [{covers: [{image, scan_of}]}].
        // The front cover of the first group becomes the missing cover_url.
        DB::statement(<<<'SQL'
            UPDATE games
            SET cover_url = (
                SELECT c ->> 'image'
                FROM jsonb_path_query(import_payload::jsonb, '$.covers[*].covers[*]') AS c
                WHERE c ->> 'scan_of' = 'Front Cover' AND c ->> 'image' IS NOT NULL
                LIMIT 1
            )
            WHERE cover_url IS NULL
              AND COALESCE(import_payload::jsonb -> 'covers', '[]'::jsonb)
                  NOT IN ('[]'::jsonb, 'null'::jsonb)
        SQL);
    }

    public function down(): void
    {
        // Recovered data is indistinguishable from imported data; nothing to undo.
    }
};
