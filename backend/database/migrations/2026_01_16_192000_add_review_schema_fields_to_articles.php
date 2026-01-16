<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Review Schema fields
            $table->decimal('review_rating', 3, 1)->nullable()->after('is_noindex');
            $table->json('review_pros')->nullable()->after('review_rating');
            $table->json('review_cons')->nullable()->after('review_pros');

            // Content freshness
            $table->timestamp('content_updated_at')->nullable()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['review_rating', 'review_pros', 'review_cons', 'content_updated_at']);
        });
    }
};
