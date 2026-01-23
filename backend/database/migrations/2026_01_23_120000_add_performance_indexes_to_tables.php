<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Using raw SQL with IF NOT EXISTS for PostgreSQL to make migration idempotent

        // Articles table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles (author_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles (status, published_at)');

        // Comments table indexes (polymorphic relationship)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_commentable ON comments (commentable_type, commentable_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at)');

        // Guides table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_difficulty ON guides (difficulty)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides (author_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides (created_at)');

        // Threads table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads (category_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads (author_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads (is_pinned)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_is_locked ON threads (is_locked)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads (created_at)');

        // Posts table indexes (forum posts)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts (thread_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at)');

        // Videos table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos (published_at)');

        // Products table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at)');

        // Categories table indexes
        DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_type_parent ON categories (type, parent_id)');

        // Reviews table indexes (if separate from articles)
        // Check if reviews table exists
        $reviewsTableExists = DB::select("SELECT to_regclass('public.reviews') as exists");
        if ($reviewsTableExists[0]->exists !== null) {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews (author_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes if they exist
        DB::statement('DROP INDEX IF EXISTS idx_articles_category_id');
        DB::statement('DROP INDEX IF EXISTS idx_articles_author_id');
        DB::statement('DROP INDEX IF EXISTS idx_articles_status');
        DB::statement('DROP INDEX IF EXISTS idx_articles_published_at');
        DB::statement('DROP INDEX IF EXISTS idx_articles_status_published');

        DB::statement('DROP INDEX IF EXISTS idx_comments_commentable');
        DB::statement('DROP INDEX IF EXISTS idx_comments_user_id');
        DB::statement('DROP INDEX IF EXISTS idx_comments_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_guides_difficulty');
        DB::statement('DROP INDEX IF EXISTS idx_guides_author_id');
        DB::statement('DROP INDEX IF EXISTS idx_guides_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_threads_category_id');
        DB::statement('DROP INDEX IF EXISTS idx_threads_author_id');
        DB::statement('DROP INDEX IF EXISTS idx_threads_is_pinned');
        DB::statement('DROP INDEX IF EXISTS idx_threads_is_locked');
        DB::statement('DROP INDEX IF EXISTS idx_threads_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_posts_thread_id');
        DB::statement('DROP INDEX IF EXISTS idx_posts_user_id');
        DB::statement('DROP INDEX IF EXISTS idx_posts_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_videos_published_at');

        DB::statement('DROP INDEX IF EXISTS idx_products_is_active');
        DB::statement('DROP INDEX IF EXISTS idx_products_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_categories_type');
        DB::statement('DROP INDEX IF EXISTS idx_categories_parent_id');
        DB::statement('DROP INDEX IF EXISTS idx_categories_type_parent');

        // Reviews table
        $reviewsTableExists = DB::select("SELECT to_regclass('public.reviews') as exists");
        if ($reviewsTableExists[0]->exists !== null) {
            DB::statement('DROP INDEX IF EXISTS idx_reviews_product_id');
            DB::statement('DROP INDEX IF EXISTS idx_reviews_author_id');
            DB::statement('DROP INDEX IF EXISTS idx_reviews_rating');
            DB::statement('DROP INDEX IF EXISTS idx_reviews_created_at');
        }
    }
};
