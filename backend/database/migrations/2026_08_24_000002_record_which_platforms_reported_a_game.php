<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Which stores reported a game, as opposed to where its owner plays it.
 *
 * `user_games.platform` was doing both jobs and could only do one. It is free
 * text the reader can edit — "where I play this" — and the importers were
 * also stamping it, first one to arrive winning. So a game the Xbox import
 * created and the Steam import later filled with hours kept saying Xbox: 37
 * rows on the live site, including Morrowind at 243 hours and Skyrim at 156,
 * every one of them wearing an Xbox mark over Steam's numbers.
 *
 * Provenance is a set — a game can genuinely be on two stores — so it gets a
 * column shaped like one, and `platform` goes back to being the reader's own
 * word for it.
 *
 * json rather than a Postgres TEXT[]: nothing queries this by containment,
 * and the test suite runs SQLite, where `@>` does not exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->json('sources')->nullable()->after('platform');
        });

        /*
         * Reconstructed from what the two writers left behind, which is enough
         * to be exact: `playtime_source` is only ever set by an importer, and
         * the three capitalised platform names are only ever written by one.
         * A reader who typed "Switch" or "PC" into the field keeps it as their
         * label and gains no source, which is correct — nothing reported it.
         */
        DB::table('user_games')
            ->select('id', 'platform', 'playtime_source')
            ->orderBy('id')
            ->chunk(500, function ($rows) {
                foreach ($rows as $row) {
                    $sources = [];

                    if (in_array($row->platform, ['Steam', 'Xbox', 'PlayStation'], true)) {
                        $sources[] = strtolower($row->platform);
                    }

                    if ($row->playtime_source && in_array($row->playtime_source, ['steam', 'xbox', 'playstation'], true)) {
                        $sources[] = $row->playtime_source;
                    }

                    $sources = array_values(array_unique($sources));

                    if ($sources !== []) {
                        DB::table('user_games')->where('id', $row->id)->update(['sources' => json_encode($sources)]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('sources');
        });
    }
};
