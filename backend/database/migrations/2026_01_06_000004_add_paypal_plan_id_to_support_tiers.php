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
        Schema::table('support_tiers', function (Blueprint $table) {
            if (!Schema::hasColumn('support_tiers', 'paypal_plan_id')) {
                $table->string('paypal_plan_id')->nullable()->after('price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tiers', function (Blueprint $table) {
            $table->dropColumn(['paypal_plan_id']);
        });
    }
};
