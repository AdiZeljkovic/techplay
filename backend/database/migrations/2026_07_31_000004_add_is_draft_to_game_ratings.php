<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets a user park a half-written review. Drafts are private: they never
     * appear on the game page and never earn XP/bounty until published.
     */
    public function up(): void
    {
        Schema::table('game_ratings', function (Blueprint $table) {
            $table->boolean('is_draft')->default(false)->after('review')->index();
        });
    }

    public function down(): void
    {
        Schema::table('game_ratings', function (Blueprint $table) {
            $table->dropColumn('is_draft');
        });
    }
};
