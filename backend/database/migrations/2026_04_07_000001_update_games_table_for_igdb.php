<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['rawg_id']);
            $table->dropColumn('rawg_id');
            $table->unsignedBigInteger('igdb_id')->nullable()->after('slug');
            $table->index('igdb_id');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['igdb_id']);
            $table->dropColumn('igdb_id');
            $table->unsignedInteger('rawg_id')->nullable()->after('slug');
            $table->index('rawg_id');
        });
    }
};
