<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The canonical TechPlay games schema.
 *
 * The table was an archive of three retired systems wearing their names:
 * RAWG's shape (`background_image`, `metacritic` — zero on every row, a
 * `platforms` json in RAWG's nesting), Moby's crawl bookkeeping (six
 * `*_crawled_at` stamps, `moby_*` columns), and payload blobs named after the
 * crawler that filled them. This migration renames what stays, drops what is
 * dead, promotes what was buried in JSON into real columns, and adds the
 * empty columns the catalogue will be filled into next (videos, developers,
 * publishers, age ratings).
 *
 * Deliberately NOT a new table: everything on the site points at games.id and
 * games.slug, and a staged rename keeps every reference alive.
 *
 * Data provenance moves to game_external_ids (moby_id, provider 'mobygames'),
 * which finally gives that table a purpose. The raw Moby payload survives as
 * `import_payload` — it is the only copy of half the catalogue's descriptions.
 */
return new class extends Migration
{
    public function up(): void
    {
        $pg = DB::getDriverName() === 'pgsql';

        // ── 1. New columns ───────────────────────────────────────────────
        Schema::table('games', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->json('alt_titles')->nullable();
            $table->json('videos')->nullable();
            $table->json('age_ratings')->nullable();
            $table->text('website')->nullable();
        });

        if ($pg) {
            DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS developers TEXT[] DEFAULT '{}'");
            DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS publishers TEXT[] DEFAULT '{}'");
        } else {
            Schema::table('games', function (Blueprint $table) {
                $table->text('developers')->nullable()->default('{}');
                $table->text('publishers')->nullable()->default('{}');
            });
        }

        // ── 2. Backfill from the Moby payload (data exists only on pgsql) ─
        if ($pg) {
            DB::statement(<<<'SQL'
                UPDATE games SET
                    description = NULLIF(details_data::jsonb ->> 'description', ''),
                    alt_titles  = CASE
                        WHEN COALESCE(details_data::jsonb -> 'alternate_titles', '[]'::jsonb) NOT IN ('[]'::jsonb, 'null'::jsonb)
                        THEN details_data::jsonb -> 'alternate_titles' END,
                    age_ratings = CASE
                        WHEN COALESCE(details_data::jsonb -> 'ratings', '[]'::jsonb) NOT IN ('[]'::jsonb, 'null'::jsonb)
                        THEN details_data::jsonb -> 'ratings' END,
                    website     = NULLIF(details_data::jsonb ->> 'official_url', '')
                WHERE details_data IS NOT NULL
            SQL);

            // The store aggregator wrote developer/publisher as scalars into
            // its payload; Moby never filled them at all. Promote what exists.
            DB::statement(<<<'SQL'
                UPDATE games SET developers = ARRAY[details_data::jsonb ->> 'developer']
                WHERE NULLIF(details_data::jsonb ->> 'developer', '') IS NOT NULL
            SQL);
            DB::statement(<<<'SQL'
                UPDATE games SET publishers = ARRAY[details_data::jsonb ->> 'publisher']
                WHERE NULLIF(details_data::jsonb ->> 'publisher', '') IS NOT NULL
            SQL);

            // The aggregator has been writing trailers into movies_data — zero
            // rows in any local export, but live for the release-window games.
            // They move into videos before movies_data is dropped below.
            DB::statement(<<<'SQL'
                UPDATE games SET videos = movies_data::jsonb
                WHERE movies_data IS NOT NULL
                  AND movies_data::text NOT IN ('[]', 'null', '')
            SQL);

            // Provenance: the Moby id becomes an external id like any other.
            DB::statement(<<<'SQL'
                INSERT INTO game_external_ids (game_id, provider, external_id, created_at, updated_at)
                SELECT id, 'mobygames', moby_id::text, NOW(), NOW()
                FROM games WHERE moby_id IS NOT NULL
                ON CONFLICT DO NOTHING
            SQL);
        }

        // ── 3. Drop the dead weight ──────────────────────────────────────
        // Indexes on a doomed column must go first: Postgres would drop them
        // implicitly, but SQLite (the test database) refuses the column drop
        // while an index still references it. Same syntax on both.
        $doomedIndexes = ['games_hub_name_idx', 'games_hub_rating_idx', 'games_hub_released_idx',
            'games_hub_metacritic_idx', 'games_has_description_idx',
            'games_has_description_index',
            'games_metacritic_index', 'games_details_crawled_at_index',
            'games_movies_crawled_at_index', 'games_screenshots_crawled_at_index',
            'games_series_crawled_at_index', 'games_suggested_crawled_at_index',
            'games_additions_crawled_at_index'];

        if (! $pg) {
            // On Postgres the moby_id unique is a constraint and dies with the
            // column; SQLite models it as a plain index that blocks the drop.
            $doomedIndexes[] = 'games_moby_id_unique';
        }

        foreach ($doomedIndexes as $idx) {
            DB::statement("DROP INDEX IF EXISTS {$idx}");
        }

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn([
                'metacritic', 'short_screenshots', 'movies_data', 'series_data',
                'suggested_data', 'additions_data', 'has_description', 'moby_id',
                'details_crawled_at', 'screenshots_crawled_at', 'movies_crawled_at',
                'series_crawled_at', 'suggested_crawled_at', 'additions_crawled_at',
                // RAWG's nested platforms json — platform_names takes the name below.
                'platforms',
            ]);
        });

        // ── 4. Renames (indexes follow their columns automatically) ──────
        Schema::table('games', function (Blueprint $table) {
            $table->renameColumn('background_image', 'cover_url');
            $table->renameColumn('screenshots_data', 'screenshots');
            $table->renameColumn('genre_names', 'genres');
            $table->renameColumn('platform_names', 'platforms');
            $table->renameColumn('tag_names', 'tags');
            $table->renameColumn('moby_group_id', 'series_key');
            $table->renameColumn('moby_group_name', 'series_name');
            $table->renameColumn('details_data', 'import_payload');
        });

        // ── 5. Rebuilt and tidied indexes ────────────────────────────────
        if ($pg) {
            // The hub's browse set is "games with a description"; the partial
            // indexes cover exactly that slice.
            DB::statement('CREATE INDEX IF NOT EXISTS games_hub_name_idx ON games (name) WHERE description IS NOT NULL');
            DB::statement('CREATE INDEX IF NOT EXISTS games_hub_rating_idx ON games (rating DESC NULLS LAST) WHERE description IS NOT NULL');
            DB::statement('CREATE INDEX IF NOT EXISTS games_hub_released_idx ON games (released DESC NULLS LAST) WHERE description IS NOT NULL');

            // Cosmetic: the GIN indexes keep working after the rename but
            // carry the old names; rename so the catalogue reads honestly.
            foreach ([
                'games_genre_names_gin' => 'games_genres_gin',
                'games_platform_names_gin' => 'games_platforms_gin',
                'games_tag_names_gin' => 'games_tags_gin',
                'games_moby_group_id_index' => 'games_series_key_index',
            ] as $old => $new) {
                DB::statement("ALTER INDEX IF EXISTS {$old} RENAME TO {$new}");
            }
        }
    }

    public function down(): void
    {
        $pg = DB::getDriverName() === 'pgsql';

        Schema::table('games', function (Blueprint $table) {
            $table->renameColumn('cover_url', 'background_image');
            $table->renameColumn('screenshots', 'screenshots_data');
            $table->renameColumn('genres', 'genre_names');
            $table->renameColumn('platforms', 'platform_names');
            $table->renameColumn('tags', 'tag_names');
            $table->renameColumn('series_key', 'moby_group_id');
            $table->renameColumn('series_name', 'moby_group_name');
            $table->renameColumn('import_payload', 'details_data');
        });

        // Dropped columns come back empty — their data is unrecoverable
        // (metacritic and movies_data held nothing anyway; crawl stamps are
        // bookkeeping for a crawler that no longer exists).
        Schema::table('games', function (Blueprint $table) {
            $table->integer('metacritic')->nullable();
            $table->json('short_screenshots')->nullable();
            $table->json('movies_data')->nullable();
            $table->json('series_data')->nullable();
            $table->json('suggested_data')->nullable();
            $table->json('additions_data')->nullable();
            $table->boolean('has_description')->default(false);
            $table->unsignedBigInteger('moby_id')->nullable();
            // The RAWG-shaped json; platform_names has its name back by now.
            $table->json('platforms')->nullable();
            $table->timestamp('details_crawled_at')->nullable();
            $table->timestamp('screenshots_crawled_at')->nullable();
            $table->timestamp('movies_crawled_at')->nullable();
            $table->timestamp('series_crawled_at')->nullable();
            $table->timestamp('suggested_crawled_at')->nullable();
            $table->timestamp('additions_crawled_at')->nullable();
        });

        if ($pg) {
            DB::statement("UPDATE games SET moby_id = e.external_id::bigint FROM game_external_ids e WHERE e.game_id = games.id AND e.provider = 'mobygames'");
            DB::statement('UPDATE games SET has_description = description IS NOT NULL');
        }

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['description', 'alt_titles', 'videos', 'age_ratings', 'website', 'developers', 'publishers']);
        });
    }
};
