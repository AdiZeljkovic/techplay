<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds critical performance indexes for high-traffic queries
     * Estimated performance improvement: 5-10x faster on forum, navigation, giveaways
     */
    public function up(): void
    {
        // Forum threads - Most common query pattern
        Schema::table('threads', function (Blueprint $table) {
            $table->index(['category_id', 'is_pinned', 'updated_at'], 'idx_threads_category_list');
        });

        // Giveaway leaderboard - Hit every 30 seconds per active user
        Schema::table('giveaway_entries', function (Blueprint $table) {
            $table->index(['giveaway_id', 'total_points'], 'idx_entries_leaderboard');
        });

        // Navigation tree - Hit on every page load
        Schema::table('categories', function (Blueprint $table) {
            $table->index('parent_id', 'idx_categories_parent');
        });

        // Comments nested queries
        Schema::table('comments', function (Blueprint $table) {
            $table->index(['parent_id', 'created_at'], 'idx_comments_nested');
        });

        // Messages inbox queries
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->index(['receiver_id', 'deleted_by_receiver'], 'idx_messages_inbox');
                $table->index(['sender_id', 'deleted_by_sender'], 'idx_messages_sent');
            });
        }

        // Giveaway task completions - Daily task checks
        Schema::table('giveaway_task_completions', function (Blueprint $table) {
            $table->index(['entry_id', 'task_id', 'completed_date'], 'idx_daily_task_check');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex('idx_threads_category_list');
        });

        Schema::table('giveaway_entries', function (Blueprint $table) {
            $table->dropIndex('idx_entries_leaderboard');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_parent');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('idx_comments_nested');
        });

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropIndex('idx_messages_inbox');
                $table->dropIndex('idx_messages_sent');
            });
        }

        Schema::table('giveaway_task_completions', function (Blueprint $table) {
            $table->dropIndex('idx_daily_task_check');
        });
    }
};
