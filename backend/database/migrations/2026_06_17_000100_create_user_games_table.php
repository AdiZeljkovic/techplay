<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            // playing | backlog | completed | wishlist | dropped
            $table->string('status')->default('backlog')->index();
            $table->boolean('is_favorite')->default(false)->index();
            $table->unsignedTinyInteger('progress')->default(0); // 0–100
            $table->unsignedInteger('hours_played')->default(0);
            $table->string('platform')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'game_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_games');
    }
};
