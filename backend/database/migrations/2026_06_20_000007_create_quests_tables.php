<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('icon')->nullable();
            $table->enum('type', ['daily', 'weekly', 'monthly', 'permanent'])->default('permanent')->index();
            $table->string('criteria_type');      // e.g. 'game_completed', 'streak_days', 'comment_posted'
            $table->unsignedInteger('criteria_value'); // threshold to complete the quest
            $table->unsignedInteger('xp_reward')->default(0);
            $table->unsignedInteger('bounty_reward')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('season_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('quest_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quest_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'quest_id']);
            $table->index(['user_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quest_progress');
        Schema::dropIfExists('quests');
    }
};
