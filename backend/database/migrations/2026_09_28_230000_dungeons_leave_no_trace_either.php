<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dungeon paths cleared since the daily reset.
 *
 * The nineteenth request, and it joins the other two endpoints that report a
 * window rather than a history: `/v2/account/raids` covers the week,
 * `/v2/account/worldbosses` the day, and now `/v2/account/dungeons` the day as
 * well. None of the three has a lifetime view anywhere in the API.
 *
 * So the same thing is true of it as of the others: from the day an account
 * connects, the difference between two of our reads is the only record that
 * will ever exist of what that player ran.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_account_state', function (Blueprint $table) {
            $table->jsonb('dungeons')->nullable()->after('daily_crafting');
        });
    }

    public function down(): void
    {
        Schema::table('gw2_account_state', function (Blueprint $table) {
            $table->dropColumn('dungeons');
        });
    }
};
