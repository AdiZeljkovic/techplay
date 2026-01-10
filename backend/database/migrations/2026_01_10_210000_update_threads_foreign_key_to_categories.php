<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * Updates threads table to use unified categories table instead of forum_categories.
     */
    public function up(): void
    {
        // Drop the old foreign key constraint
        Schema::table('threads', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        // Add new foreign key pointing to categories table
        Schema::table('threads', function (Blueprint $table) {
            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->foreign('category_id')
                ->references('id')
                ->on('forum_categories')
                ->cascadeOnDelete();
        });
    }
};
