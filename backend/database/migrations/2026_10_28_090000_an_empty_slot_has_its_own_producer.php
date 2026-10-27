<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Point the empty-slot rule at the producer that finds empty slots.
 *
 * `gear-empty-core-slot` was seeded against GearGaps, which only emits slots
 * that have something in them. As soon as a character had one empty slot the
 * rule's condition held and its sentence — "Nothing equipped in the {slot}" —
 * went out over every exotic piece the character was actually wearing, while
 * the empty slot itself got no card.
 *
 * Fixed in the seeder too, but seeders are not run on deploy and migrations
 * are, so the row that is already in production is corrected here.
 *
 * Only while it still names the wrong producer. Which producer a rule runs is
 * mechanism, not editorial judgement — there is no reading of "nothing
 * equipped" under which GearGaps is right — so this does not wait for
 * `reviewed_at` the way a threshold or a sentence would.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('gw2_rules')) {
            return;
        }

        DB::table('gw2_rules')
            ->where('key', 'gear-empty-core-slot')
            ->where('producer', 'gear.slot_below_ascended')
            ->update(['producer' => 'gear.empty_core_slot', 'updated_at' => now()]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('gw2_rules')) {
            return;
        }

        DB::table('gw2_rules')
            ->where('key', 'gear-empty-core-slot')
            ->where('producer', 'gear.empty_core_slot')
            ->update(['producer' => 'gear.slot_below_ascended', 'updated_at' => now()]);
    }
};
