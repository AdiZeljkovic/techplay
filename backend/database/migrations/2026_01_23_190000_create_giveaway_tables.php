<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Main giveaways table
        Schema::create('giveaways', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('rules')->nullable();
            $table->string('featured_image')->nullable();

            // Prize info
            $table->string('prize_name');
            $table->decimal('prize_value', 10, 2)->nullable();
            $table->string('prize_image')->nullable();

            // Timing
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('winner_announced_at')->nullable();

            // Status
            $table->enum('status', ['draft', 'active', 'ended', 'cancelled'])->default('draft');
            $table->boolean('is_public')->default(true);
            $table->integer('max_entries_per_user')->default(100); // Point cap

            // Relationships
            $table->foreignId('winner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
        });

        // Tasks for each giveaway
        Schema::create('giveaway_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giveaway_id')->constrained()->cascadeOnDelete();

            $table->enum('type', [
                'facebook_like',
                'facebook_share',
                'instagram_follow',
                'youtube_subscribe',
                'twitter_follow',
                'twitter_retweet',
                'discord_join',
                'visit_url',
                'share_giveaway',
                'daily_visit',
                'referral',
                'custom',
            ]);

            $table->string('title');
            $table->string('description')->nullable();
            $table->integer('points')->default(1);
            $table->string('url')->nullable();
            $table->enum('verification_type', ['self_report', 'oauth', 'automatic'])->default('self_report');
            $table->boolean('is_required')->default(false);
            $table->boolean('is_repeatable')->default(false); // For daily tasks
            $table->integer('sort_order')->default(0);

            $table->timestamps();
        });

        // User entries
        Schema::create('giveaway_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giveaway_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->integer('total_points')->default(0);
            $table->string('referral_code')->unique()->nullable();
            $table->foreignId('referred_by')->nullable()->constrained('giveaway_entries')->nullOnDelete();
            $table->integer('referral_count')->default(0);

            // Fraud detection
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamps();

            $table->unique(['giveaway_id', 'user_id']);
        });

        // Track completed tasks
        Schema::create('giveaway_task_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('giveaway_entries')->cascadeOnDelete();
            $table->foreignId('task_id')->constrained('giveaway_tasks')->cascadeOnDelete();

            $table->timestamp('completed_at');
            $table->date('completed_date')->nullable(); // For daily tasks

            $table->timestamps();

            $table->unique(['entry_id', 'task_id', 'completed_date'], 'unique_task_per_day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('giveaway_task_completions');
        Schema::dropIfExists('giveaway_entries');
        Schema::dropIfExists('giveaway_tasks');
        Schema::dropIfExists('giveaways');
    }
};
