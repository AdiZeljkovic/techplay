<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * PERFORMANCE: Add indexes for frequently queried columns
     */
    public function up(): void
    {
        // Threads table indexes
        if (!$this->indexExists('threads', 'threads_slug_index')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->index('slug');
            });
        }

        if (!$this->indexExists('threads', 'threads_category_id_updated_at_index')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->index(['category_id', 'updated_at']);
            });
        }

        if (!$this->indexExists('threads', 'threads_is_pinned_index')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->index('is_pinned');
            });
        }

        if (!$this->indexExists('threads', 'threads_author_id_index')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->index('author_id');
            });
        }

        // Posts table indexes
        if (!$this->indexExists('posts', 'posts_thread_id_index')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->index('thread_id');
            });
        }

        if (!$this->indexExists('posts', 'posts_author_id_index')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->index('author_id');
            });
        }

        // Comments table indexes
        if (!$this->indexExists('comments', 'comments_commentable_status_index')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->index(['commentable_type', 'commentable_id', 'status']);
            });
        }

        if (!$this->indexExists('comments', 'comments_user_id_index')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->index('user_id');
            });
        }

        // Categories table indexes
        if (!$this->indexExists('categories', 'categories_type_index')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->index('type');
            });
        }

        if (!$this->indexExists('categories', 'categories_slug_type_index')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->index(['slug', 'type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex(['slug']);
            $table->dropIndex(['category_id', 'updated_at']);
            $table->dropIndex(['is_pinned']);
            $table->dropIndex(['author_id']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['thread_id']);
            $table->dropIndex(['author_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['commentable_type', 'commentable_id', 'status']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['slug', 'type']);
        });
    }

    /**
     * Check if an index exists (PostgreSQL compatible)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $result = DB::select("
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ? AND indexname = ?
        ", [$table, $indexName]);

        return count($result) > 0;
    }
};
