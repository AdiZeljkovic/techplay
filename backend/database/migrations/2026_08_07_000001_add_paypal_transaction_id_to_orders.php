<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A captured payment had nowhere to record its PayPal capture id, so the
 * refund webhook could never find the order it belonged to and refunds were
 * silently ignored.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'paypal_transaction_id')) {
                $table->string('paypal_transaction_id')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'paypal_transaction_id')) {
                $table->dropColumn('paypal_transaction_id');
            }
        });
    }
};
