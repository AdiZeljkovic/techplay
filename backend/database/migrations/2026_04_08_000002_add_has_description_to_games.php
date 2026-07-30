<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // sqlite (tests): plain column, no JSON backfill needed
            Schema::table('games', function (Blueprint $table) {
                $table->boolean('has_description')->default(false)->index();
            });

            return;
        }

        DB::statement('ALTER TABLE games ADD COLUMN IF NOT EXISTS has_description BOOLEAN NOT NULL DEFAULT FALSE');
        DB::statement('CREATE INDEX IF NOT EXISTS games_has_description_idx ON games(has_description)');

        // Backfill from JSON — one-time UPDATE
        DB::statement("
            UPDATE games
            SET has_description = TRUE
            WHERE details_crawled_at IS NOT NULL
              AND details_data->>'description_raw' IS NOT NULL
              AND LENGTH(details_data->>'description_raw') > 50
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            Schema::table('games', function (Blueprint $table) {
                $table->dropColumn('has_description');
            });

            return;
        }

        DB::statement('DROP INDEX IF EXISTS games_has_description_idx');
        DB::statement('ALTER TABLE games DROP COLUMN IF EXISTS has_description');
    }
};
