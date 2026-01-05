<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('paypal_subscription_id')->nullable()->after('email');
            $table->string('paypal_customer_id')->nullable()->after('paypal_subscription_id');
            $table->timestamp('subscription_ends_at')->nullable()->after('paypal_customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['paypal_subscription_id', 'paypal_customer_id', 'subscription_ends_at']);
        });
    }
};
