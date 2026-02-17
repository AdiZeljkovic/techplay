<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('battlenet_id')->nullable()->unique()->after('discord_refresh_token');
            $table->string('battlenet_token', 500)->nullable()->after('battlenet_id');
            $table->string('battlenet_refresh_token', 500)->nullable()->after('battlenet_token');
            $table->string('battlenet_region', 2)->nullable()->after('battlenet_refresh_token'); // 'us', 'eu', 'kr', 'tw'
            $table->string('battletag', 32)->nullable()->after('battlenet_region'); // e.g., "Garamel#2123"

            $table->index('battlenet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['battlenet_id']);
            $table->dropColumn([
                'battlenet_id',
                'battlenet_token',
                'battlenet_refresh_token',
                'battlenet_region',
                'battletag',
            ]);
        });
    }
};
