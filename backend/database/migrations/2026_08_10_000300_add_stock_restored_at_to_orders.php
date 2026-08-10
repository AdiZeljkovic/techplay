<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records that a cancelled order has already had its stock returned.
 *
 * Placing an order takes the units off the shelf immediately — correct, it is
 * what stops two people buying the last one. But nothing ever put them back.
 * Cancelling an order in the admin panel only changed a status string, so a
 * cash-on-delivery order that was never paid for, or a customer who changed
 * their mind, left the product reading "out of stock" until somebody noticed
 * and edited the number by hand.
 *
 * The timestamp is what keeps a status flipped cancelled → pending → cancelled
 * from returning the same units twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('stock_restored_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('stock_restored_at');
        });
    }
};
