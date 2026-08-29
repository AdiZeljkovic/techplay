<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A giveaway remembers whether its reminder went out.
 *
 * The job looked for giveaways ending between 23 and 25 hours from now — a
 * two-hour window — and ran every six hours. A giveaway whose end fell in the
 * other four hours of a cycle matched no run at all and its entrants were never
 * reminded, which is two out of every three of them.
 *
 * Widening the window without a record of what had already been sent would have
 * traded silence for duplicates. This column is that record: the reminder goes
 * out once, whenever the job first sees the giveaway inside a day of closing,
 * and a run that is missed or delayed still catches it on the next pass instead
 * of stepping over it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('giveaways', function (Blueprint $table) {
            $table->timestamp('reminder_sent_at')->nullable()->after('ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('giveaways', function (Blueprint $table) {
            $table->dropColumn('reminder_sent_at');
        });
    }
};
