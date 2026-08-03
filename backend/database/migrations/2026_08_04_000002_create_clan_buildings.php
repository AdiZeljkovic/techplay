<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 of the clan system: the base itself. Buildings hold a level;
 * projects are how a level is raised — funded from the treasury, then built
 * on a timer. docs/33-clan-system-plan.md §3–4.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clan_buildings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->string('key', 32);
            $table->unsignedTinyInteger('level')->default(0);
            $table->timestamps();

            $table->unique(['clan_id', 'key']);
        });

        Schema::create('clan_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->string('building_key', 32);
            $table->unsignedTinyInteger('target_level');

            $table->unsignedInteger('cost_intel')->default(0);
            $table->unsignedInteger('cost_materials')->default(0);
            $table->unsignedInteger('funded_intel')->default(0);
            $table->unsignedInteger('funded_materials')->default(0);

            // funding → building → done | cancelled
            $table->string('status', 16)->default('funding');
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finishes_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['clan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_projects');
        Schema::dropIfExists('clan_buildings');
    }
};
