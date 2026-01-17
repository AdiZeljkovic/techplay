<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PERFORMANCE: Add indexes for commonly queried foreign keys and filters
 * This migration improves query performance for articles, threads, posts, and comments
 */
return new class extends Migration {
    public function up(): void
    {
        // Articles indexes
        Schema::table('articles', function (Blueprint $table) {
            // Composite index for listing queries (status + published_at)
            $table->index(['status', 'published_at'], 'idx_articles_status_published');
            // Foreign key indexes
            $table->index('author_id', 'idx_articles_author');
            $table->index('category_id', 'idx_articles_category');
            // Index for featured/hero queries
            $table->index('is_featured_in_hero', 'idx_articles_featured');
        });

        // Threads indexes
        Schema::table('threads', function (Blueprint $table) {
            $table->index('author_id', 'idx_threads_author');
            $table->index('category_id', 'idx_threads_category');
            $table->index(['category_id', 'created_at'], 'idx_threads_category_created');
        });

        // Posts indexes
        Schema::table('posts', function (Blueprint $table) {
            $table->index('author_id', 'idx_posts_author');
            $table->index('thread_id', 'idx_posts_thread');
        });

        // Comments indexes
        Schema::table('comments', function (Blueprint $table) {
            $table->index('user_id', 'idx_comments_user');
            $table->index(['commentable_type', 'commentable_id', 'status'], 'idx_comments_morph_status');
            $table->index('parent_id', 'idx_comments_parent');
        });

        // Categories indexes
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['type', 'parent_id'], 'idx_categories_type_parent');
        });

        // Newsletter indexes
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->index('email_verified_at', 'idx_newsletter_verified');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('idx_articles_status_published');
            $table->dropIndex('idx_articles_author');
            $table->dropIndex('idx_articles_category');
            $table->dropIndex('idx_articles_featured');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex('idx_threads_author');
            $table->dropIndex('idx_threads_category');
            $table->dropIndex('idx_threads_category_created');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('idx_posts_author');
            $table->dropIndex('idx_posts_thread');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('idx_comments_user');
            $table->dropIndex('idx_comments_morph_status');
            $table->dropIndex('idx_comments_parent');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_type_parent');
        });

        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropIndex('idx_newsletter_verified');
        });
    }
};
