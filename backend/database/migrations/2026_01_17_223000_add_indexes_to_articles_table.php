<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Composite index for common "status=published AND published_at <= now" queries
            $table->index(['status', 'published_at']);

            // Index for sorting by views (trending/popular)
            $table->index('views');

            // Index for hero section filtering
            $table->index('is_featured_in_hero');
        });
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
