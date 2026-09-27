<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The ledger was recording upgrades and dropping infusions.
 *
 * Both hang off the same equipment entry and both are item ids, but they answer
 * different questions. An upgrade is a rune or a sigil; an infusion is where
 * Agony Resistance comes from, which is the single number that decides whether
 * a player can enter a fractal tier at all.
 *
 * Verified on the test account on 28 September 2026: two worn pieces each carry
 * item 49433, "+10 Agony Infusion". Without this column those twenty points sat
 * only inside `gw2_characters.equipment` — readable for the character wearing
 * them, invisible to any question about what the account owns. A goal planner
 * that cannot see them tells somebody to buy infusions they already have.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_item_ledger', function (Blueprint $table) {
            $table->jsonb('infusions')->nullable()->after('upgrades');
        });
    }

    public function down(): void
    {
        Schema::table('gw2_item_ledger', function (Blueprint $table) {
            $table->dropColumn('infusions');
        });
    }
};
