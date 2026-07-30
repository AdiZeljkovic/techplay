<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // GIN/tsvector indexes are Postgres-only
        }

        DB::statement("CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON articles USING GIN (to_tsvector('english', title || ' ' || coalesce(excerpt, '')))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS idx_articles_fulltext');
    }
};
