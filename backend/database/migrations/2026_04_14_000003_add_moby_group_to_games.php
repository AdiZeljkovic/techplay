<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedInteger('moby_group_id')->nullable()->after('moby_id');
            $table->string('moby_group_name', 200)->nullable()->after('moby_group_id');
            $table->index('moby_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['moby_group_id']);
            $table->dropColumn(['moby_group_id', 'moby_group_name']);
        });
    }
};
