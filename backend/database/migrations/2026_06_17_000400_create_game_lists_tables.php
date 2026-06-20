<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(true)->index();
            $table->string('cover_image')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
            $table->index(['user_id', 'is_public']);
        });

        Schema::create('game_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['game_list_id', 'game_id']);
            $table->index(['game_list_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_list_items');
        Schema::dropIfExists('game_lists');
    }
};
