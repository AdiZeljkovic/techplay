<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Real "recently played" signal for the dashboard's Continue Playing rail.
     * Written by: collection upsert (status=playing), Steam library sync
     * (recently played), and presence updates. Readers fall back to updated_at
     * for rows that predate this column (COALESCE in ProfileService).
     */
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->timestamp('last_played_at')->nullable()->after('hours_played')->index();
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropColumn('last_played_at');
        });
    }
};
