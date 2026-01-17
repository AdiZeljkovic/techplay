<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw SQL for "IF NOT EXISTS" to handle existing indexes safely (Postgres)
        DB::statement('CREATE INDEX IF NOT EXISTS articles_status_published_at_index ON articles (status, published_at)');
        DB::statement('CREATE INDEX IF NOT EXISTS articles_views_index ON articles (views)');
        // Note: boolean casting to int might be needed for some DBs but Postgres handles bool index fine usually.
        // Actually, for pure boolean index in Postgres:
        // CREATE INDEX ... ON articles (is_featured_in_hero) works. 
        // Let's stick to standard syntax first.
        DB::statement('CREATE INDEX IF NOT EXISTS articles_is_featured_in_hero_index ON articles (is_featured_in_hero)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
            $table->dropIndex(['views']);
            $table->dropIndex(['is_featured_in_hero']);
        });
    }
};
