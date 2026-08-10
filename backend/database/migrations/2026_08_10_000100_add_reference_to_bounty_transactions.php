<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An idempotency key for bounty awards.
 *
 * Several payouts are meant to happen once for a given thing, and none of them
 * could enforce it. Completing a game paid 50 bounty on every transition into
 * `completed`, so flipping a game between "playing" and "completed" printed
 * money — and deleting the collection entry and re-adding it defeated any flag
 * stored on the row itself.
 *
 * The ledger is the one record that survives all of that, so the guarantee
 * belongs here: a reference may appear at most once per user, and
 * BountyService::award refuses a repeat instead of paying it.
 *
 * Nullable because most awards are genuinely repeatable — a comment, a streak
 * day, a solution. Postgres allows many NULLs under a unique index, so those
 * are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bounty_transactions', function (Blueprint $table) {
            $table->string('reference')->nullable()->after('reason');
            $table->unique(['user_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::table('bounty_transactions', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'reference']);
            $table->dropColumn('reference');
        });
    }
};
