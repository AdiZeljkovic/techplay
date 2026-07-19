<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Weekly leaderboards: snapshots now also capture XP, and the period
     * column fits weekly keys ("2026-W29") alongside monthly ("2026-07").
     */
    public function up(): void
    {
        Schema::table('reputation_snapshots', function (Blueprint $table) {
            $table->string('period', 10)->change();
            $table->integer('xp')->default(0)->after('reputation');
        });
    }

    public function down(): void
    {
        Schema::table('reputation_snapshots', function (Blueprint $table) {
            $table->dropColumn('xp');
            $table->string('period', 7)->change();
        });
    }
};
