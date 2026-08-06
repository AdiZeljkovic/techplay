<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Stops the catalogue claiming day-precision it does not have.
 *
 * Moby encodes "we only know the year" as January 1st, and the import
 * stamped every row 'day' regardless — so 37k games announce a birthday
 * they never had. A January 1st date on a non-aggregator row becomes
 * 'year', and the frontend renders just that. The cost is the handful of
 * games genuinely released on New Year's Day; the alternative cost is
 * 37,000 invented dates.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('games')
            ->whereNull('match_key')
            ->whereRaw(DB::getDriverName() === 'pgsql'
                ? 'extract(month from released) = 1 and extract(day from released) = 1'
                : "strftime('%m-%d', released) = '01-01'")
            ->update(['release_precision' => 'year']);
    }

    public function down(): void
    {
        DB::table('games')
            ->whereNull('match_key')
            ->where('release_precision', 'year')
            ->update(['release_precision' => 'day']);
    }
};
