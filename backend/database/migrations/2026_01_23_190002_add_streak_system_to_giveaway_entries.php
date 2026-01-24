<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('giveaway_entries', function (Blueprint $table) {
            $table->integer('streak_days')->default(0)->after('referral_count');
            $table->date('last_visit_date')->nullable()->after('streak_days');
            $table->integer('streak_bonus_points')->default(0)->after('last_visit_date');

            $table->index('last_visit_date');
        });
    }

    public function down(): void
    {
        Schema::table('giveaway_entries', function (Blueprint $table) {
            $table->dropColumn(['streak_days', 'last_visit_date', 'streak_bonus_points']);
        });
    }
};
