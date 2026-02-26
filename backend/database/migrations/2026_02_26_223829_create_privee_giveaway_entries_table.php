<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('privee_giveaway_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giveaway_id')->constrained()->cascadeOnDelete();
            $table->string('privee_user_id');
            $table->string('privee_email')->nullable();
            $table->string('privee_display_name')->nullable();
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->unique(['giveaway_id', 'privee_user_id']);
            $table->index('giveaway_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('privee_giveaway_entries');
    }
};
