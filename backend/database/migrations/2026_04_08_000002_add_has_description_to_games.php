<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
        DB::statement('DROP INDEX IF EXISTS games_has_description_idx');
        DB::statement('ALTER TABLE games DROP COLUMN IF EXISTS has_description');
    }
};
