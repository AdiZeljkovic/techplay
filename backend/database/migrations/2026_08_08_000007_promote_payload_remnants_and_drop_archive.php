<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The Moby archive retires. The three things still read from
 * import_payload become real columns — vote counts, the attribute list,
 * the flattened box-art gallery — and then the blob goes, reclaiming a
 * third of the games table (~140 MB + 178 MB TOAST after VACUUM).
 *
 * The user's call: the catalogue is ours now, enriched from live
 * sources; a raw crawl archive from a retired provider earns nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedInteger('ratings_count')->default(0);
            $table->json('attributes')->nullable();
            $table->json('box_art')->nullable();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                UPDATE games SET
                    ratings_count = COALESCE(NULLIF(import_payload::jsonb ->> 'num_votes', '')::int, 0),
                    attributes = CASE
                        WHEN COALESCE(import_payload::jsonb -> 'attributes', '[]'::jsonb) NOT IN ('[]'::jsonb, 'null'::jsonb)
                        THEN import_payload::jsonb -> 'attributes' END
                WHERE import_payload IS NOT NULL
            SQL);

            // Box art needs the same flatten the API used — front covers
            // first, twelve at most — which is PHP work, chunked.
            // Raw rows on purpose: the model no longer casts the archive,
            // so decoding by hand is the only honest read.
            DB::table('games')
                ->whereRaw("coalesce(import_payload::jsonb -> 'covers', '[]'::jsonb) not in ('[]'::jsonb, 'null'::jsonb)")
                ->select(['id', 'import_payload'])
                ->orderBy('id')
                ->chunkById(500, function ($games) {
                    foreach ($games as $game) {
                        $payload = json_decode((string) $game->import_payload, true) ?: [];
                        $flat = collect($payload['covers'] ?? [])
                            ->flatMap(fn ($group) => $group['covers'] ?? [])
                            ->filter(fn ($c) => ! empty($c['image']))
                            ->map(fn ($c) => [
                                'image' => $c['image'],
                                'thumbnail' => $c['thumbnail_image'] ?? null,
                                'label' => $c['scan_of'] ?? null,
                            ])
                            ->unique('image')
                            ->sortBy(fn ($c) => $c['label'] === 'Front Cover' ? 0 : 1)
                            ->take(12)
                            ->values()
                            ->all();

                        if ($flat !== []) {
                            DB::table('games')->where('id', $game->id)
                                ->update(['box_art' => json_encode($flat)]);
                        }
                    }
                });
        }

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('import_payload');
        });
    }

    public function down(): void
    {
        // The archive is unrecoverable by design; the promoted columns stay.
        Schema::table('games', function (Blueprint $table) {
            $table->json('import_payload')->nullable();
        });
    }
};
