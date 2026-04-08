<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add TEXT[] columns for fast GIN-indexed hub queries
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS genre_names TEXT[] DEFAULT '{}'");
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS platform_names TEXT[] DEFAULT '{}'");
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS tag_names TEXT[] DEFAULT '{}'");

        // GIN indexes for @> and = ANY() operators
        DB::statement("CREATE INDEX IF NOT EXISTS games_genre_names_gin ON games USING GIN(genre_names)");
        DB::statement("CREATE INDEX IF NOT EXISTS games_platform_names_gin ON games USING GIN(platform_names)");
        DB::statement("CREATE INDEX IF NOT EXISTS games_tag_names_gin ON games USING GIN(tag_names)");
    }

    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS games_genre_names_gin");
        DB::statement("DROP INDEX IF EXISTS games_platform_names_gin");
        DB::statement("DROP INDEX IF EXISTS games_tag_names_gin");
        DB::statement("ALTER TABLE games DROP COLUMN IF EXISTS genre_names");
        DB::statement("ALTER TABLE games DROP COLUMN IF EXISTS platform_names");
        DB::statement("ALTER TABLE games DROP COLUMN IF EXISTS tag_names");
    }
};
