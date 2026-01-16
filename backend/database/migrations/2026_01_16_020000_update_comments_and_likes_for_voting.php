<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('comment_likes', function (Blueprint $table) {
            $table->enum('type', ['up', 'down'])->default('up')->after('user_id');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->integer('score')->default(0)->after('content');
            // We keep likes_count for now to avoid immediate breakage if accessed dynamically, 
            // but effectively we will stop using it or sync it.
            // Plan said drop, but safer to keep and maybe drop later.
            // Actually, let's look at implementation plan: "Drop likes_count".
            // Okay, let's drop it to force valid usage.
            $table->dropColumn('likes_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comment_likes', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('score');
            $table->integer('likes_count')->default(0);
        });
    }
};
