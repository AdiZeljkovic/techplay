<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type'); // theme | frame | badge | perk
            $table->text('description')->nullable();
            $table->unsignedInteger('cost')->default(0); // bounty cost (0 = free / tier-unlock)
            $table->string('required_tier')->nullable(); // support tier name required, null = none
            $table->string('value')->nullable(); // theme accent color / frame gradient / badge color
            $table->string('asset')->nullable(); // optional image (badge/frame art)
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'is_active', 'sort_order']);
        });

        Schema::create('user_customizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customization_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_equipped')->default(false);
            $table->string('acquired_via')->default('bounty'); // bounty | tier | reward | admin
            $table->timestamps();

            $table->unique(['user_id', 'customization_id']);
            $table->index(['user_id', 'is_equipped']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_customizations');
        Schema::dropIfExists('customizations');
    }
};
