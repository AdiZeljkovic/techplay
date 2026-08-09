<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SupportController has always queried and written `payment_id` and
 * `is_recurring`, but the table was created without them and never altered —
 * so every pledge died on an unknown column. The feature has been returning
 * 500 rather than taking money.
 *
 * The unique index is the point, not an afterthought: `payment_id` is the only
 * thing standing between one completed PayPal order and an unlimited number of
 * support months claimed from it, by any account that learns the reference.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_supports', function (Blueprint $table) {
            $table->string('payment_id')->nullable()->after('support_tier_id');
            $table->boolean('is_recurring')->default(false)->after('status');

            // Global, not per-user: a reference already spent by someone else
            // must not be spendable again.
            $table->unique('payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_supports', function (Blueprint $table) {
            $table->dropUnique(['payment_id']);
            $table->dropColumn(['payment_id', 'is_recurring']);
        });
    }
};
