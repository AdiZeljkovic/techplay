<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // GIN/tsvector indexes are Postgres-only
        }

        DB::statement("CREATE INDEX IF NOT EXISTS idx_threads_fulltext ON threads USING GIN (to_tsvector('english', title || ' ' || coalesce(content, '')))");
        DB::statement("CREATE INDEX IF NOT EXISTS idx_posts_fulltext ON posts USING GIN (to_tsvector('english', coalesce(content, '')))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS idx_threads_fulltext');
        DB::statement('DROP INDEX IF EXISTS idx_posts_fulltext');
    }
};
