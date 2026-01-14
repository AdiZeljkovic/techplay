<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('editorial_channels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // 'general', 'news', 'reviews'
            $table->string('description')->nullable();
            $table->string('icon')->default('heroicon-o-chat-bubble-left-right');
            $table->string('color')->default('primary');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_private')->default(false);
            $table->json('allowed_roles')->nullable(); // Spatie role names
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('editorial_channels');
    }
};
