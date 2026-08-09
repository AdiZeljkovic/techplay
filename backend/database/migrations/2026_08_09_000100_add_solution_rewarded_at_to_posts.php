<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Marking a post as the solution paid out reputation, bounty, clan resources
 * and an achievement check — and un-marking took none of it back. Toggling the
 * flag was therefore an unbounded printer: mark, unmark, mark, at 20 requests
 * a minute, into an account the attacker also controls.
 *
 * A timestamp rather than a boolean, so the ledger stays readable: it records
 * when the answer was first accepted, not merely that it once was.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->timestamp('solution_rewarded_at')->nullable()->after('is_solution');
        });

        // Posts already accepted keep their payout — backfilling stops the
        // existing solutions on the site from being re-monetised once.
        DB::table('posts')
            ->where('is_solution', true)
            ->update(['solution_rewarded_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('solution_rewarded_at');
        });
    }
};
