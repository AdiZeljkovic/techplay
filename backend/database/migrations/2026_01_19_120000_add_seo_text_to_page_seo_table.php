<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('page_seo', function (Blueprint $table) {
            $table->longText('seo_text')->nullable()->after('is_noindex');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_seo', function (Blueprint $table) {
            $table->dropColumn('seo_text');
        });
    }
};
