<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Laravel Pulse, removed.
 *
 * It was measured on 17 Aug 2026 and the numbers made the decision. Of
 * 1,483,270 rows it had accumulated, **1,483,067 were cache hit and miss
 * records** — 647 MB of a 1080 MB database. Everything Pulse existed to tell
 * anybody fit in the remaining 203 rows: 123 exceptions, 34 slow requests, 23
 * slow jobs.
 *
 * Sampling those cache rows down to one percent brought the database from
 * 1139 MB to 488 MB, which showed the shape of the problem rather than fixing
 * it: a monitoring tool that costs more than the thing it monitors, on a
 * catalogue table of 377 MB, and whose useful signal is a rounding error.
 * Netdata will take over the server-level view.
 *
 * The create migration is deleted rather than kept, so a fresh database never
 * builds these tables. This one uses dropIfExists so it is a no-op there and
 * still clears the three tables on any database that already has them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('pulse_aggregates');
        Schema::dropIfExists('pulse_entries');
        Schema::dropIfExists('pulse_values');
    }

    /**
     * Deliberately empty.
     *
     * Rolling back would have to recreate three tables from a package that is
     * no longer installed, and there is nothing to put in them. Reinstalling
     * `laravel/pulse` publishes its own migration.
     */
    public function down(): void
    {
        //
    }
};
