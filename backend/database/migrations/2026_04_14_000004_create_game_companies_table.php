<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_companies', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('moby_company_id')->unique();
            $table->string('name', 300);
            $table->string('slug', 300)->unique();
            $table->string('moby_url', 500)->nullable();
            $table->enum('role', ['developer', 'publisher', 'both'])->default('developer');
            $table->unsignedInteger('games_count')->default(0);
            $table->timestamp('details_crawled_at')->nullable();
            $table->timestamps();

            $table->index('role');
            $table->index('games_count');
        });

        Schema::create('game_company', function (Blueprint $table) {
            $table->unsignedBigInteger('game_id');
            $table->unsignedBigInteger('game_company_id');
            $table->enum('role', ['developer', 'publisher']);

            $table->primary(['game_id', 'game_company_id', 'role']);
            $table->index('game_company_id');

            $table->foreign('game_id')->references('id')->on('games')->onDelete('cascade');
            $table->foreign('game_company_id')->references('id')->on('game_companies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_company');
        Schema::dropIfExists('game_companies');
    }
};
