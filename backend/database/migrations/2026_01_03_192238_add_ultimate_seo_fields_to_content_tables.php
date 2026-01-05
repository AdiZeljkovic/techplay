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
        $tables = ['articles', 'categories', 'reviews'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                // Check if columns exist before adding (safety measure)
                if (!Schema::hasColumn($tableName, 'seo_title')) {
                    $table->string('seo_title')->nullable()->after('slug');
                }
                if (!Schema::hasColumn($tableName, 'seo_description')) {
                    $table->text('seo_description')->nullable()->after('seo_title');
                }
                if (!Schema::hasColumn($tableName, 'focus_keyword')) {
                    $table->string('focus_keyword')->nullable()->after('seo_description');
                }
                if (!Schema::hasColumn($tableName, 'canonical_url')) {
                    $table->string('canonical_url')->nullable()->after('focus_keyword');
                }
                if (!Schema::hasColumn($tableName, 'is_noindex')) {
                    $table->boolean('is_noindex')->default(false)->after('canonical_url');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['articles', 'categories', 'reviews'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropColumn(['seo_title', 'seo_description', 'focus_keyword', 'canonical_url', 'is_noindex']);
            });
        }
    }
};
