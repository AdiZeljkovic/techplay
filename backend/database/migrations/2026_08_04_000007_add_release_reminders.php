<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Tell me when this lands." Wishlisting says you want a game; this says you
 * want to hear about it the day it arrives — different decisions, one flag.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->boolean('notify_on_release')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('notify_on_release');
        });
    }
};
