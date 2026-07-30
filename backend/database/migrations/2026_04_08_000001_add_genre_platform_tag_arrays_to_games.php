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
            // sqlite (tests): plain text columns — the PostgresArray cast handles both formats
            Schema::table('games', function (Blueprint $table) {
                $table->text('genre_names')->nullable()->default('{}');
                $table->text('platform_names')->nullable()->default('{}');
                $table->text('tag_names')->nullable()->default('{}');
            });

            return;
        }

        // Add TEXT[] columns for fast GIN-indexed hub queries
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS genre_names TEXT[] DEFAULT '{}'");
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS platform_names TEXT[] DEFAULT '{}'");
        DB::statement("ALTER TABLE games ADD COLUMN IF NOT EXISTS tag_names TEXT[] DEFAULT '{}'");

        // GIN indexes for @> and = ANY() operators
        DB::statement('CREATE INDEX IF NOT EXISTS games_genre_names_gin ON games USING GIN(genre_names)');
        DB::statement('CREATE INDEX IF NOT EXISTS games_platform_names_gin ON games USING GIN(platform_names)');
        DB::statement('CREATE INDEX IF NOT EXISTS games_tag_names_gin ON games USING GIN(tag_names)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            Schema::table('games', function (Blueprint $table) {
                $table->dropColumn(['genre_names', 'platform_names', 'tag_names']);
            });

            return;
        }

        DB::statement('DROP INDEX IF EXISTS games_genre_names_gin');
        DB::statement('DROP INDEX IF EXISTS games_platform_names_gin');
        DB::statement('DROP INDEX IF EXISTS games_tag_names_gin');
        DB::statement('ALTER TABLE games DROP COLUMN IF EXISTS genre_names');
        DB::statement('ALTER TABLE games DROP COLUMN IF EXISTS platform_names');
        DB::statement('ALTER TABLE games DROP COLUMN IF EXISTS tag_names');
    }
};
