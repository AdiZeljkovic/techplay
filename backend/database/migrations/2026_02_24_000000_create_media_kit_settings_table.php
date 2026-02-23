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
        Schema::create('media_kit_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->enum('type', ['text', 'number', 'json', 'boolean'])->default('text');
            $table->enum('section', ['about', 'stats', 'social', 'audience', 'content', 'development']);
            $table->integer('order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['section', 'is_visible', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_kit_settings');
    }
};
