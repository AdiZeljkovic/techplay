<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `company_size` is not a headcount.
 *
 * It was read as one and the studio page said "7 staff" under Sega. The values
 * run 1 to 8 across all 2,963 companies that carry one — 1,381 of them are a 1
 * — so it is a size band, and IGDB publishes no table naming the bands. A
 * number that cannot be read is worse than an absent one: it looks like a fact.
 *
 * Dropped rather than left unused, because a column called `employees` holding
 * an uninterpretable enum is a trap for whoever finds it next.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('employees');
        });
    }

    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->unsignedInteger('employees')->nullable();
        });
    }
};
