<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Pin to profile" — up to 4 games a user curates into their showcase.
     * NULL = not showcased; 1..4 = display order.
     */
    public function up(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->unsignedTinyInteger('showcase_order')->nullable()->after('is_favorite');
            $table->index(['user_id', 'showcase_order'], 'user_games_showcase_idx');
        });
    }

    public function down(): void
    {
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropIndex('user_games_showcase_idx');
            $table->dropColumn('showcase_order');
        });
    }
};
