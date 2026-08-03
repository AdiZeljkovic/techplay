<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rarity is what makes a store grid readable at a glance — without it every
 * card carries the same weight and the eye has nowhere to land. Both catalogs
 * get the column; the backfill bands existing items by price so nothing has
 * to be set by hand.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['reward_items', 'customizations'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->string('rarity', 16)->default('common');
            });
        }

        // Price is the honest proxy for rarity in a catalog this size.
        foreach (['reward_items', 'customizations'] as $table) {
            DB::table($table)->where('cost', '>=', 1500)->update(['rarity' => 'legendary']);
            DB::table($table)->whereBetween('cost', [750, 1499])->update(['rarity' => 'epic']);
            DB::table($table)->whereBetween('cost', [400, 749])->update(['rarity' => 'rare']);
            DB::table($table)->whereBetween('cost', [1, 399])->update(['rarity' => 'uncommon']);
        }

        // Tier-gated cosmetics are free but exclusive — the ladder, not the
        // price tag, is what makes them rare.
        DB::table('customizations')->whereNotNull('required_tier')->update(['rarity' => 'legendary']);
    }

    public function down(): void
    {
        foreach (['reward_items', 'customizations'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('rarity');
            });
        }
    }
};
