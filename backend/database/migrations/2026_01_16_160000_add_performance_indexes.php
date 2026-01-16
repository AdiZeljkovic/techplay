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
            if (Schema::hasColumn('articles', 'status')) {
                $table->index('status', 'articles_status_index');
            }
            if (Schema::hasColumn('articles', 'category')) {
                $table->index('category', 'articles_category_index');
            }
            if (Schema::hasColumn('articles', 'published_at')) {
                $table->index('published_at', 'articles_published_at_index');
            }
            if (Schema::hasColumn('articles', 'is_featured')) {
                $table->index('is_featured', 'articles_is_featured_index');
            }
            // Composite index for common listing query
            if (Schema::hasColumn('articles', 'status') && Schema::hasColumn('articles', 'published_at')) {
                $table->index(['status', 'published_at'], 'articles_status_published_index');
            }
        });

        // Reviews
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'status')) {
                $table->index('status', 'reviews_status_index');
            }
            if (Schema::hasColumn('reviews', 'category')) {
                $table->index('category', 'reviews_category_index');
            }
            if (Schema::hasColumn('reviews', 'published_at')) {
                $table->index('published_at', 'reviews_published_at_index');
            }
            // Composite for listings
            if (Schema::hasColumn('reviews', 'status') && Schema::hasColumn('reviews', 'published_at')) {
                $table->index(['status', 'published_at'], 'reviews_status_published_index');
            }
        });

        // Forum Threads
        Schema::table('threads', function (Blueprint $table) {
            if (Schema::hasColumn('threads', 'is_pinned')) {
                $table->index('is_pinned', 'threads_is_pinned_index');
            }
            if (Schema::hasColumn('threads', 'created_at')) {
                $table->index('created_at', 'threads_created_at_index');
            }
            // Composite for category listings
            if (Schema::hasColumn('threads', 'category_id') && Schema::hasColumn('threads', 'is_pinned') && Schema::hasColumn('threads', 'created_at')) {
                $table->index(['category_id', 'is_pinned', 'created_at'], 'threads_category_listing_index');
            }
        });

        // Forum Posts
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'created_at')) {
                $table->index('created_at', 'posts_created_at_index');
            }
        });

        // Guides
        Schema::table('guides', function (Blueprint $table) {
            if (Schema::hasColumn('guides', 'difficulty')) {
                $table->index('difficulty', 'guides_difficulty_index');
            }
            if (Schema::hasColumn('guides', 'status')) {
                $table->index('status', 'guides_status_index');
            }
            if (Schema::hasColumn('guides', 'published_at')) {
                $table->index('published_at', 'guides_published_at_index');
            }
        });

        // Products
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'is_active')) {
                $table->index('is_active', 'products_is_active_index');
            }
        });

        // Videos
        if (Schema::hasTable('videos')) {
            Schema::table('videos', function (Blueprint $table) {
                if (Schema::hasColumn('videos', 'published_at')) {
                    $table->index('published_at', 'videos_published_at_index');
                }
            });
        }

        // Orders
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
        // Safely drop indexes if they exist
        $this->dropIndexIfExists('articles', 'articles_status_index');
        $this->dropIndexIfExists('articles', 'articles_category_index');
        $this->dropIndexIfExists('articles', 'articles_published_at_index');
        $this->dropIndexIfExists('articles', 'articles_is_featured_index');
        $this->dropIndexIfExists('articles', 'articles_status_published_index');

        $this->dropIndexIfExists('reviews', 'reviews_status_index');
        $this->dropIndexIfExists('reviews', 'reviews_category_index');
        $this->dropIndexIfExists('reviews', 'reviews_published_at_index');
        $this->dropIndexIfExists('reviews', 'reviews_status_published_index');

        $this->dropIndexIfExists('threads', 'threads_is_pinned_index');
        $this->dropIndexIfExists('threads', 'threads_created_at_index');
        $this->dropIndexIfExists('threads', 'threads_category_listing_index');

        $this->dropIndexIfExists('posts', 'posts_created_at_index');

        $this->dropIndexIfExists('guides', 'guides_difficulty_index');
        $this->dropIndexIfExists('guides', 'guides_status_index');
        $this->dropIndexIfExists('guides', 'guides_published_at_index');

        $this->dropIndexIfExists('products', 'products_is_active_index');

        $this->dropIndexIfExists('videos', 'videos_published_at_index');

        $this->dropIndexIfExists('orders', 'orders_status_index');
        $this->dropIndexIfExists('orders', 'orders_payment_status_index');
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        try {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) use ($indexName) {
                    $table->dropIndex($indexName);
                });
            }
        } catch (\Exception $e) {
            // Index doesn't exist, ignore
        }
    }
};

