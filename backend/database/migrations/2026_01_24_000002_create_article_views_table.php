<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * PERFORMANCE: View tracking table for throttling and analytics
     * SECURITY: Prevents view count manipulation with fingerprint tracking
     */
    public function up(): void
    {
        Schema::create('article_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('article_id');
            $table->string('ip_address', 45)->index(); // IPv6 support
            $table->string('fingerprint', 32)->index(); // MD5 hash
            $table->timestamp('created_at')->useCurrent();

            // Composite index for fast throttling lookups
            $table->index(['article_id', 'fingerprint', 'created_at'], 'idx_article_views_throttle');
        });

        // Create views table for guides
        Schema::create('guide_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('guide_id');
            $table->string('ip_address', 45)->index();
            $table->string('fingerprint', 32)->index();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['guide_id', 'fingerprint', 'created_at'], 'idx_guide_views_throttle');
        });

        // Create views table for reviews
        Schema::create('review_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('review_id');
            $table->string('ip_address', 45)->index();
            $table->string('fingerprint', 32)->index();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['review_id', 'fingerprint', 'created_at'], 'idx_review_views_throttle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('article_views');
        Schema::dropIfExists('guide_views');
        Schema::dropIfExists('review_views');
    }
};
