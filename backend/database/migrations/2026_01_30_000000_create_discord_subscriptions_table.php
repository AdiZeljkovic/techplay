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
        Schema::create('discord_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('discord_id');
            $table->string('type'); // 'news' or 'giveaway'
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamps();

            // Unique constraint to prevent duplicate subscriptions
            $table->unique(['discord_id', 'type']);

            // Index for faster lookups
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discord_subscriptions');
    }
};
