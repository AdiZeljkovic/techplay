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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'paypal_order_id')) {
                $table->string('paypal_order_id')->nullable()->unique()->after('user_id');
            }
            if (!Schema::hasColumn('orders', 'items')) {
                $table->json('items')->nullable()->after('amount');
            }
            if (!Schema::hasColumn('orders', 'status')) {
                $table->string('status')->default('PENDING')->after('paypal_order_id');
            }
            // Ensure amount exists too, though usually it does. 
            // If total_price exists instead of amount, we might need a rename or just use total_price.
            // But my controller uses 'total_price' now. So checking for that.
            if (!Schema::hasColumn('orders', 'total_price') && !Schema::hasColumn('orders', 'amount')) {
                $table->decimal('total_price', 10, 2)->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['paypal_order_id', 'items']);
        });
    }
};
