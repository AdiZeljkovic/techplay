<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->unsignedInteger('rawg_id')->nullable();
            $table->string('name', 500);
            $table->date('released')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->integer('metacritic')->nullable();
            $table->string('background_image', 500)->nullable();
            $table->json('platforms')->nullable();
            $table->json('short_screenshots')->nullable();
            $table->json('details_data')->nullable();
            $table->json('screenshots_data')->nullable();
            $table->json('movies_data')->nullable();
            $table->json('series_data')->nullable();
            $table->json('suggested_data')->nullable();
            $table->json('additions_data')->nullable();
            $table->timestamp('details_crawled_at')->nullable();
            $table->timestamp('screenshots_crawled_at')->nullable();
            $table->timestamp('movies_crawled_at')->nullable();
            $table->timestamp('series_crawled_at')->nullable();
            $table->timestamp('suggested_crawled_at')->nullable();
            $table->timestamp('additions_crawled_at')->nullable();
            $table->timestamps();

            $table->index('slug');
            $table->index('rawg_id');
            $table->index('rating');
            $table->index('metacritic');
            $table->index('details_crawled_at');
            $table->index('screenshots_crawled_at');
            $table->index('movies_crawled_at');
            $table->index('series_crawled_at');
            $table->index('suggested_crawled_at');
            $table->index('additions_crawled_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
