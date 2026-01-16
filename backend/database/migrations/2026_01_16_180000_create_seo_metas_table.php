<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('seo_metas', function (Blueprint $table) {
            $table->id();
            $table->morphs('seoable'); // seoable_type, seoable_id
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 170)->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('og_image', 500)->nullable();
            $table->string('focus_keyword', 100)->nullable();
            $table->boolean('is_noindex')->default(false);
            $table->boolean('is_nofollow')->default(false);
            $table->json('schema_data')->nullable(); // For custom schema markup
            $table->timestamps();

            $table->unique(['seoable_type', 'seoable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_metas');
    }
};
