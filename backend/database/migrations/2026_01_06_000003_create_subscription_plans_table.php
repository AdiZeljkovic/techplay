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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Premium Monthly"
            $table->string('slug')->unique(); // e.g. "premium-monthly"
            $table->string('paypal_plan_id')->unique(); // P-XXXXXXXX
            $table->string('paypal_product_id')->nullable();
            $table->decimal('price', 8, 2);
            $table->string('currency')->default('USD');
            $table->integer('interval_count')->default(1);
            $table->string('interval_unit')->default('MONTH'); // MONTH, YEAR
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
