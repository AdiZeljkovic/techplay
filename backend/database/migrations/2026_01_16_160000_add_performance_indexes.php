<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Optimization: Add indexes for commonly queried columns.
 * This significantly improves query performance on listing pages.
 */
return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Articles - Most frequently queried table
        Schema::table('articles', function (Blueprint $table) {
            $table->index('status', 'articles_status_index');
            $table->index('category', 'articles_category_index');
            $table->index('published_at', 'articles_published_at_index');
            $table->index('is_featured', 'articles_is_featured_index');
            // Composite index for common listing query
            $table->index(['status', 'published_at'], 'articles_status_published_index');
        });

        // Reviews
        Schema::table('reviews', function (Blueprint $table) {
            $table->index('status', 'reviews_status_index');
            $table->index('category', 'reviews_category_index');
            $table->index('published_at', 'reviews_published_at_index');
            // Composite for listings
            $table->index(['status', 'published_at'], 'reviews_status_published_index');
        });

        // Forum Threads
        Schema::table('threads', function (Blueprint $table) {
            $table->index('is_pinned', 'threads_is_pinned_index');
            $table->index('created_at', 'threads_created_at_index');
            // Composite for category listings
            $table->index(['category_id', 'is_pinned', 'created_at'], 'threads_category_listing_index');
        });

        // Forum Posts
        Schema::table('posts', function (Blueprint $table) {
            $table->index('created_at', 'posts_created_at_index');
        });

        // Guides
        Schema::table('guides', function (Blueprint $table) {
            $table->index('difficulty', 'guides_difficulty_index');
            if (Schema::hasColumn('guides', 'status')) {
                $table->index('status', 'guides_status_index');
            }
            if (Schema::hasColumn('guides', 'published_at')) {
                $table->index('published_at', 'guides_published_at_index');
            }
        });

        // Products
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_active', 'products_is_active_index');
        });

        // Videos (if published_at exists)
        if (Schema::hasTable('videos')) {
            Schema::table('videos', function (Blueprint $table) {
                if (Schema::hasColumn('videos', 'published_at')) {
                    $table->index('published_at', 'videos_published_at_index');
                }
            });
        }

        // Orders - for order listing and filtering
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'status')) {
                    $table->index('status', 'orders_status_index');
                }
                if (Schema::hasColumn('orders', 'payment_status')) {
                    $table->index('payment_status', 'orders_payment_status_index');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('articles_status_index');
            $table->dropIndex('articles_category_index');
            $table->dropIndex('articles_published_at_index');
            $table->dropIndex('articles_is_featured_index');
            $table->dropIndex('articles_status_published_index');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_status_index');
            $table->dropIndex('reviews_category_index');
            $table->dropIndex('reviews_published_at_index');
            $table->dropIndex('reviews_status_published_index');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex('threads_is_pinned_index');
            $table->dropIndex('threads_created_at_index');
            $table->dropIndex('threads_category_listing_index');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_created_at_index');
        });

        Schema::table('guides', function (Blueprint $table) {
            $table->dropIndex('guides_difficulty_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_is_active_index');
        });
    }
};
