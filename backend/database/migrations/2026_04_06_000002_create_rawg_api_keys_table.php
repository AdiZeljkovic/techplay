<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rawg_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('api_key', 64)->unique();
            $table->string('label')->nullable();
            $table->unsignedInteger('calls_used')->default(0);
            $table->unsignedInteger('calls_limit')->default(19800);
            $table->timestamp('reset_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rawg_api_keys');
    }
};
