<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gta6_characters', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('alias')->nullable();
            $table->string('role')->nullable(); // protagonist | antagonist | supporting
            $table->text('description')->nullable();
            $table->string('image', 1000)->nullable();
            $table->json('gallery')->nullable();
            $table->string('status')->default('confirmed'); // confirmed | rumored
            $table->boolean('is_published')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('is_published');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gta6_characters');
    }
};
