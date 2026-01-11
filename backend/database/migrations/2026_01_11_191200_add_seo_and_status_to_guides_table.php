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
        Schema::table('guides', function (Blueprint $table) {
            $table->string('seo_title')->nullable()->after('difficulty');
            $table->text('seo_description')->nullable()->after('seo_title');
            $table->string('focus_keyword')->nullable()->after('seo_description');
            $table->string('canonical_url')->nullable()->after('focus_keyword');
            $table->boolean('is_noindex')->default(false)->after('canonical_url');
            $table->string('status')->default('draft')->after('is_noindex'); // draft, published, ready_for_review
            $table->timestamp('published_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->dropColumn([
                'seo_title',
                'seo_description',
                'focus_keyword',
                'canonical_url',
                'is_noindex',
                'status',
                'published_at',
            ]);
        });
    }
};
