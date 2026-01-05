<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update Users Table
        Schema::table('users', function (Blueprint $table) {
            $table->integer('xp')->default(0);
            $table->json('gamertags')->nullable(); // Steam, Epic, etc.
            $table->json('pc_specs')->nullable(); // CPU, GPU, RAM, etc.
            $table->json('settings')->nullable(); // Privacy, etc.
        });

        // 2. Achievements Table
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon_path')->nullable();
            $table->integer('points')->default(10);
            $table->string('criteria_type'); // e.g., 'posts_count', 'comments_count'
            $table->integer('criteria_value'); // e.g., 50
            $table->timestamps();
        });

        // 3. User Achievements Pivot
        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at');
            $table->timestamps();
        });

        // 4. Messages Table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['xp', 'gamertags', 'pc_specs', 'settings']);
        });
    }
};
