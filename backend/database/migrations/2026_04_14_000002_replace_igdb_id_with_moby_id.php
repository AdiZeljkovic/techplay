<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['igdb_id']);
            $table->dropColumn('igdb_id');
            $table->unsignedInteger('moby_id')->nullable()->unique()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropUnique(['moby_id']);
            $table->dropColumn('moby_id');
            $table->unsignedBigInteger('igdb_id')->nullable()->after('slug');
            $table->index('igdb_id');
        });
    }
};
