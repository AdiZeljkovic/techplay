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
        Schema::table('wow_analyses', function (Blueprint $table) {
            // Equipment/Gear data
            $table->unsignedSmallInteger('item_level')->nullable()->after('has_void_elf');
            $table->json('equipment')->nullable()->after('item_level'); // 16 slots compact
            $table->unsignedTinyInteger('tier_pieces')->default(0)->after('equipment'); // 0-5
            $table->json('missing_enchants')->nullable()->after('tier_pieces');
            $table->json('missing_gems')->nullable()->after('missing_enchants');

            // Mythic+ data
            $table->unsignedSmallInteger('mythic_plus_score')->nullable()->after('missing_gems');
            $table->json('best_mythic_runs')->nullable()->after('mythic_plus_score'); // top 5 runs
            $table->boolean('vault_unlocked')->default(false)->after('best_mythic_runs');

            // Raid progression data
            $table->string('raid_tier_name', 100)->nullable()->after('vault_unlocked'); // "Nerub-ar Palace"
            $table->string('raid_progress', 20)->nullable()->after('raid_tier_name'); // "7/8M, 8/8H"
            $table->json('raid_kills')->nullable()->after('raid_progress'); // boss kill matrix

            // Add indexes for leaderboards and filtering
            $table->index('item_level', 'ilvl_leaderboard');
            $table->index('mythic_plus_score', 'mythic_leaderboard');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wow_analyses', function (Blueprint $table) {
            $table->dropIndex('ilvl_leaderboard');
            $table->dropIndex('mythic_leaderboard');

            $table->dropColumn([
                'item_level',
                'equipment',
                'tier_pieces',
                'missing_enchants',
                'missing_gems',
                'mythic_plus_score',
                'best_mythic_runs',
                'vault_unlocked',
                'raid_tier_name',
                'raid_progress',
                'raid_kills',
            ]);
        });
    }
};
