<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Articles table indexes
        Schema::table('articles', function (Blueprint $table) {
            $table->index('category_id', 'idx_articles_category_id');
            $table->index('author_id', 'idx_articles_author_id');
            $table->index('status', 'idx_articles_status');
            $table->index('published_at', 'idx_articles_published_at');
            $table->index(['status', 'published_at'], 'idx_articles_status_published');
        });

        // Comments table indexes (polymorphic relationship)
        Schema::table('comments', function (Blueprint $table) {
            $table->index(['commentable_type', 'commentable_id'], 'idx_comments_commentable');
            $table->index('user_id', 'idx_comments_user_id');
            $table->index('created_at', 'idx_comments_created_at');
        });

        // Guides table indexes
        Schema::table('guides', function (Blueprint $table) {
            $table->index('difficulty', 'idx_guides_difficulty');
            $table->index('author_id', 'idx_guides_author_id');
            $table->index('created_at', 'idx_guides_created_at');
        });

        // Threads table indexes
        Schema::table('threads', function (Blueprint $table) {
            $table->index('category_id', 'idx_threads_category_id');
            $table->index('author_id', 'idx_threads_author_id');
            $table->index('is_pinned', 'idx_threads_is_pinned');
            $table->index('is_locked', 'idx_threads_is_locked');
            $table->index('created_at', 'idx_threads_created_at');
        });

        // Posts table indexes (forum posts)
        Schema::table('posts', function (Blueprint $table) {
            $table->index('thread_id', 'idx_posts_thread_id');
            $table->index('user_id', 'idx_posts_user_id');
            $table->index('created_at', 'idx_posts_created_at');
        });

        // Videos table indexes
        Schema::table('videos', function (Blueprint $table) {
            $table->index('published_at', 'idx_videos_published_at');
        });

        // Products table indexes
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_active', 'idx_products_is_active');
            $table->index('created_at', 'idx_products_created_at');
        });

        // Categories table indexes
        Schema::table('categories', function (Blueprint $table) {
            $table->index('type', 'idx_categories_type');
            $table->index('parent_id', 'idx_categories_parent_id');
            $table->index(['type', 'parent_id'], 'idx_categories_type_parent');
        });

        // Reviews table indexes (if separate from articles)
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->index('product_id', 'idx_reviews_product_id');
                $table->index('author_id', 'idx_reviews_author_id');
                $table->index('rating', 'idx_reviews_rating');
                $table->index('created_at', 'idx_reviews_created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Articles table
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('idx_articles_category_id');
            $table->dropIndex('idx_articles_author_id');
            $table->dropIndex('idx_articles_status');
            $table->dropIndex('idx_articles_published_at');
            $table->dropIndex('idx_articles_status_published');
        });

        // Comments table
        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('idx_comments_commentable');
            $table->dropIndex('idx_comments_user_id');
            $table->dropIndex('idx_comments_created_at');
        });

        // Guides table
        Schema::table('guides', function (Blueprint $table) {
            $table->dropIndex('idx_guides_difficulty');
            $table->dropIndex('idx_guides_author_id');
            $table->dropIndex('idx_guides_created_at');
        });

        // Threads table
        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex('idx_threads_category_id');
            $table->dropIndex('idx_threads_author_id');
            $table->dropIndex('idx_threads_is_pinned');
            $table->dropIndex('idx_threads_is_locked');
            $table->dropIndex('idx_threads_created_at');
        });

        // Posts table
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('idx_posts_thread_id');
            $table->dropIndex('idx_posts_user_id');
            $table->dropIndex('idx_posts_created_at');
        });

        // Videos table
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex('idx_videos_published_at');
        });

        // Products table
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_is_active');
            $table->dropIndex('idx_products_created_at');
        });

        // Categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_type');
            $table->dropIndex('idx_categories_parent_id');
            $table->dropIndex('idx_categories_type_parent');
        });

        // Reviews table
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropIndex('idx_reviews_product_id');
                $table->dropIndex('idx_reviews_author_id');
                $table->dropIndex('idx_reviews_rating');
                $table->dropIndex('idx_reviews_created_at');
            });
        }
    }
};
