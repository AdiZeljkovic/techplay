<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Disable transaction wrapping so each index creation is independent.
     * This allows us to skip indexes that already exist.
     */
    public $withinTransaction = false;

    /**
     * Run the migrations.
     * PERFORMANCE: Add indexes for frequently queried columns
     */
    public function up(): void
    {
        // Threads table indexes
        $this->safeAddIndex('threads', ['slug']);
        $this->safeAddIndex('threads', ['category_id', 'updated_at']);
        $this->safeAddIndex('threads', ['is_pinned']);
        $this->safeAddIndex('threads', ['author_id']);

        // Posts table indexes
        $this->safeAddIndex('posts', ['thread_id']);
        $this->safeAddIndex('posts', ['author_id']);

        // Comments table indexes
        $this->safeAddIndex('comments', ['commentable_type', 'commentable_id', 'status']);
        $this->safeAddIndex('comments', ['user_id']);

        // Categories table indexes
        $this->safeAddIndex('categories', ['type']);
        $this->safeAddIndex('categories', ['slug', 'type']);
    }

    /**
     * Safely add an index, ignoring if it already exists.
     */
    private function safeAddIndex(string $table, array $columns): void
    {
        try {
            Schema::table($table, function (Blueprint $t) use ($columns) {
                $t->index($columns);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Index already exists - ignore
            if (!str_contains($e->getMessage(), 'already exists')) {
                throw $e;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->safeDropIndex('threads', ['slug']);
        $this->safeDropIndex('threads', ['category_id', 'updated_at']);
        $this->safeDropIndex('threads', ['is_pinned']);
        $this->safeDropIndex('threads', ['author_id']);

        $this->safeDropIndex('posts', ['thread_id']);
        $this->safeDropIndex('posts', ['author_id']);

        $this->safeDropIndex('comments', ['commentable_type', 'commentable_id', 'status']);
        $this->safeDropIndex('comments', ['user_id']);

        $this->safeDropIndex('categories', ['type']);
        $this->safeDropIndex('categories', ['slug', 'type']);
    }

    /**
     * Safely drop an index, ignoring if it doesn't exist.
     */
    private function safeDropIndex(string $table, array $columns): void
    {
        try {
            Schema::table($table, function (Blueprint $t) use ($columns) {
                $t->dropIndex($columns);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Index doesn't exist - ignore
        }
    }
};
