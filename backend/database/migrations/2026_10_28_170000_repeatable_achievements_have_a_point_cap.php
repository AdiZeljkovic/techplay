<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The ceiling on a repeatable achievement's points.
 *
 * The achievements page sums an account's points, and 159 of the 214
 * repeatable achievements pay points every time — "Party Commander" 10 a run,
 * up to 100. The account endpoint says how many times; only this says where it
 * stops. Without it the sum is either short or open-ended.
 *
 * Empty until the next catalogue read of `achievements`, which a new game
 * build triggers on its own and `gw2:catalogue --only=achievements --force`
 * triggers by hand. Until then the page leaves repeats out and says so.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->unsignedInteger('point_cap')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->dropColumn('point_cap');
        });
    }
};
