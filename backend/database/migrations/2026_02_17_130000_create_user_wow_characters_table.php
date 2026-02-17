<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_wow_characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('character_name', 12);  // WoW char name
            $table->string('realm_slug', 50);      // e.g., "silvermoon"
            $table->string('region', 2);           // 'us', 'eu', 'kr', 'tw'
            $table->string('character_class', 20)->nullable();  // "Demon Hunter", "Priest"
            $table->string('faction', 10)->nullable();          // "Alliance", "Horde"
            $table->tinyInteger('level')->default(80);
            $table->smallInteger('item_level')->nullable();
            $table->string('avatar_url')->nullable();           // Character portrait
            $table->boolean('is_main')->default(false);         // Main vs alt flag
            $table->timestamp('last_analyzed_at')->nullable();  // When last analyzed
            $table->timestamps();

            // Composite unique constraint: one user can't have duplicate char+realm+region
            $table->unique(['user_id', 'character_name', 'realm_slug', 'region'], 'user_character_unique');

            // Indexes for queries
            $table->index(['user_id', 'is_main']);
            $table->index('last_analyzed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_wow_characters');
    }
};
