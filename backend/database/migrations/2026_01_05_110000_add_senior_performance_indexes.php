<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Performance Optimization: Additional Database Indexes
 * 
 * These indexes improve query performance for:
 * - Comments lookup by type and ID (polymorphic relation)
 * - Threads lookup by category and status
 */
return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Comments polymorphic index
        if (Schema::hasTable('comments')) {
            // Check if index already exists using raw query
            if (!$this->indexExists('comments', 'comments_polymorphic_index')) {
                Schema::table('comments', function (Blueprint $table) {
                    $table->index(['commentable_type', 'commentable_id'], 'comments_polymorphic_index');
                });
            }
        }

        // Threads performance index
        if (Schema::hasTable('threads') && Schema::hasColumn('threads', 'forum_category_id')) {
            if (!$this->indexExists('threads', 'threads_category_created_index')) {
                Schema::table('threads', function (Blueprint $table) {
                    $table->index(['forum_category_id', 'created_at'], 'threads_category_created_index');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropIndex('comments_polymorphic_index');
            });
        }

        if (Schema::hasTable('threads')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->dropIndex('threads_category_created_index');
            });
        }
    }

    /**
     * Check if an index exists on a table (MySQL/SQLite compatible)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($result) > 0;
        }

        if ($driver === 'sqlite') {
            $result = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name = ?", [$indexName]);
            return count($result) > 0;
        }

        // For other drivers, assume index doesn't exist
        return false;
    }
};
