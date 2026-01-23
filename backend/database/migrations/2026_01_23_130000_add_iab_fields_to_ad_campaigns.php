<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ad_campaigns', function (Blueprint $table) {
            // IAB Standard Format
            $table->string('format')->nullable()->after('type')
                ->comment('IAB format: ros, rectangle, billboard, in-text, skyscraper, leaderboard, video-preroll, etc.');

            // Dimensions
            $table->integer('width')->nullable()->after('format')->comment('Width in pixels');
            $table->integer('height')->nullable()->after('width')->comment('Height in pixels');

            // Platform Targeting (JSON array: ["desktop", "mobile_web", "ios_app", "android_app"])
            $table->json('platforms')->nullable()->after('height')
                ->comment('Supported platforms: desktop, mobile_web, ios_app, android_app');

            // Device Targeting
            $table->enum('device_targeting', ['all', 'desktop_only', 'mobile_only'])->default('all')->after('platforms');

            // CPM Pricing
            $table->decimal('cpm_price', 10, 2)->nullable()->after('device_targeting')
                ->comment('Cost per 1000 impressions in KM');

            // Description/Notes for admin
            $table->text('description')->nullable()->after('cpm_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'format',
                'width',
                'height',
                'platforms',
                'device_targeting',
                'cpm_price',
                'description',
            ]);
        });
    }
};
