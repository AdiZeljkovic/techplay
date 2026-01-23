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
        if (Schema::hasTable('articles')) {
            $articlesColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'articles'"))->pluck('column_name');

            if ($articlesColumns->contains('category_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id)');
            }
            if ($articlesColumns->contains('author_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles (author_id)');
            }
            if ($articlesColumns->contains('status')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status)');
            }
            if ($articlesColumns->contains('published_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at)');
            }
            if ($articlesColumns->contains('status') && $articlesColumns->contains('published_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles (status, published_at)');
            }
        }

        // Comments table indexes (polymorphic relationship)
        if (Schema::hasTable('comments')) {
            $commentsColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'comments'"))->pluck('column_name');

            if ($commentsColumns->contains('commentable_type') && $commentsColumns->contains('commentable_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_commentable ON comments (commentable_type, commentable_id)');
            }
            if ($commentsColumns->contains('user_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id)');
            }
            if ($commentsColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at)');
            }
        }

        // Guides table indexes
        if (Schema::hasTable('guides')) {
            $guidesColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'guides'"))->pluck('column_name');

            if ($guidesColumns->contains('difficulty')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_difficulty ON guides (difficulty)');
            }
            if ($guidesColumns->contains('author_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides (author_id)');
            }
            if ($guidesColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides (created_at)');
            }
        }

        // Threads table indexes
        if (Schema::hasTable('threads')) {
            $threadsColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'threads'"))->pluck('column_name');

            if ($threadsColumns->contains('category_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads (category_id)');
            }
            if ($threadsColumns->contains('author_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads (author_id)');
            }
            if ($threadsColumns->contains('is_pinned')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads (is_pinned)');
            }
            if ($threadsColumns->contains('is_locked')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_is_locked ON threads (is_locked)');
            }
            if ($threadsColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads (created_at)');
            }
        }

        // Posts table indexes (forum posts)
        if (Schema::hasTable('posts')) {
            $postsColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'"))->pluck('column_name');

            if ($postsColumns->contains('thread_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts (thread_id)');
            }
            if ($postsColumns->contains('user_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id)');
            }
            if ($postsColumns->contains('author_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id)');
            }
            if ($postsColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at)');
            }
        }

        // Videos table indexes
        if (Schema::hasTable('videos')) {
            $videosColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'videos'"))->pluck('column_name');

            if ($videosColumns->contains('published_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos (published_at)');
            }
        }

        // Products table indexes
        if (Schema::hasTable('products')) {
            $productsColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'"))->pluck('column_name');

            if ($productsColumns->contains('is_active')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active)');
            }
            if ($productsColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at)');
            }
        }

        // Categories table indexes
        if (Schema::hasTable('categories')) {
            $categoriesColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'"))->pluck('column_name');

            if ($categoriesColumns->contains('type')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type)');
            }
            if ($categoriesColumns->contains('parent_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id)');
            }
            if ($categoriesColumns->contains('type') && $categoriesColumns->contains('parent_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_type_parent ON categories (type, parent_id)');
            }
        }

        // Reviews table indexes (if separate from articles)
        if (Schema::hasTable('reviews')) {
            $reviewsColumns = collect(DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'reviews'"))->pluck('column_name');

            if ($reviewsColumns->contains('product_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id)');
            }
            if ($reviewsColumns->contains('author_id')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews (author_id)');
            }
            if ($reviewsColumns->contains('rating')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating)');
            }
            if ($reviewsColumns->contains('created_at')) {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at)');
            }
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
        DB::statement('DROP INDEX IF EXISTS idx_posts_author_id');
        DB::statement('DROP INDEX IF EXISTS idx_posts_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_videos_published_at');

        DB::statement('DROP INDEX IF EXISTS idx_products_is_active');
        DB::statement('DROP INDEX IF EXISTS idx_products_created_at');

        DB::statement('DROP INDEX IF EXISTS idx_categories_type');
        DB::statement('DROP INDEX IF EXISTS idx_categories_parent_id');
        DB::statement('DROP INDEX IF EXISTS idx_categories_type_parent');

        // Reviews table
        DB::statement('DROP INDEX IF EXISTS idx_reviews_product_id');
        DB::statement('DROP INDEX IF EXISTS idx_reviews_author_id');
        DB::statement('DROP INDEX IF EXISTS idx_reviews_rating');
        DB::statement('DROP INDEX IF EXISTS idx_reviews_created_at');
    }
};
