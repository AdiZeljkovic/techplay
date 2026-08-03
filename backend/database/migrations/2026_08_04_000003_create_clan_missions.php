<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4: the mission engine. Templates are authored in the admin panel;
 * instances are spawned per clan with targets scaled to ACTIVE members, and
 * progress rides the same event pipeline that pays resources.
 * docs/33-clan-system-plan.md §5.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clan_mission_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('description', 300)->nullable();
            $table->string('type', 16); // individual | squad | operation
            // Same vocabulary as the earn reasons in config/clan.php.
            $table->string('criteria_type', 40);
            $table->unsignedInteger('base_target');
            // Squad missions: how much each counted member must contribute.
            $table->unsignedInteger('per_member_target')->nullable();
            $table->boolean('scales')->default(true);
            $table->unsignedTinyInteger('duration_days')->default(7);

            $table->unsignedInteger('reward_intel')->default(0);
            $table->unsignedInteger('reward_materials')->default(0);
            $table->unsignedInteger('reward_prestige')->default(0);

            // Operations: cumulative stages with their own rewards.
            // [{"target":10,"intel":0,"materials":200,"prestige":50}, …]
            $table->json('stages')->nullable();

            $table->unsignedTinyInteger('min_mission_control')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('clan_missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('clan_mission_templates')->cascadeOnDelete();

            $table->unsignedInteger('target');
            $table->unsignedInteger('progress')->default(0);
            $table->unsignedTinyInteger('stage')->default(0);
            $table->string('status', 16)->default('active'); // active | completed | expired

            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['clan_id', 'status']);
        });

        Schema::create('clan_mission_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount')->default(0);
            // One row per member per day — the daily mission cap reads this.
            $table->date('day');
            $table->timestamps();

            $table->unique(['clan_mission_id', 'user_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_mission_progress');
        Schema::dropIfExists('clan_missions');
        Schema::dropIfExists('clan_mission_templates');
    }
};
