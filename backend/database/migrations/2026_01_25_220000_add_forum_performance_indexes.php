<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds missing performance indexes for forum queries
     */
    public function up(): void
    {
        // Posts table - for thread post counts and user post queries
        Schema::table('posts', function (Blueprint $table) {
            // Index for fetching posts by thread (already has FK, but explicit index helps)
            if (!$this->hasIndex('posts', 'idx_posts_thread_created')) {
                $table->index(['thread_id', 'created_at'], 'idx_posts_thread_created');
            }
            // Index for user posts queries
            if (!$this->hasIndex('posts', 'idx_posts_author')) {
                $table->index('author_id', 'idx_posts_author');
            }
        });

        // Threads table - for author queries
        Schema::table('threads', function (Blueprint $table) {
            if (!$this->hasIndex('threads', 'idx_threads_author')) {
                $table->index('author_id', 'idx_threads_author');
            }
            // Index for updated_at sorting (active threads)
            if (!$this->hasIndex('threads', 'idx_threads_updated')) {
                $table->index('updated_at', 'idx_threads_updated');
            }
        });

        // Articles table - commonly queried fields
        Schema::table('articles', function (Blueprint $table) {
            // Composite index for home page hero query
            if (!$this->hasIndex('articles', 'idx_articles_hero_published')) {
                $table->index(['is_featured_in_hero', 'status', 'published_at'], 'idx_articles_hero_published');
            }
        });
    }

    /**
     * Check if index exists
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }
        return false;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('idx_posts_thread_created');
            $table->dropIndex('idx_posts_author');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex('idx_threads_author');
            $table->dropIndex('idx_threads_updated');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('idx_articles_hero_published');
        });
    }
};
