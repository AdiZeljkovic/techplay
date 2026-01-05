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
        Schema::table('articles', function (Blueprint $table) {
            // Optimizes: where('status', 'published')->orderBy('published_at', 'desc')
            $table->index(['status', 'published_at']);
        });

        // Check if we need other indexes.
        // Users: username email already unique.
        // Comments: already indexed.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
        });
    }
};
