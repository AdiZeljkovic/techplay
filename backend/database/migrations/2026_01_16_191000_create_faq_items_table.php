<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('faq_items', function (Blueprint $table) {
            $table->id();
            $table->morphs('faqable'); // article_id, category_id, etc.
            $table->string('question', 500);
            $table->text('answer');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['faqable_type', 'faqable_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faq_items');
    }
};
