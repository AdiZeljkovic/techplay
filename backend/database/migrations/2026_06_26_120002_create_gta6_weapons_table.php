<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gta6_weapons', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('weapon_type')->nullable(); // Pistol, Rifle, Melee, Shotgun, Explosive...
            $table->text('description')->nullable();
            $table->string('image', 1000)->nullable();
            $table->json('gallery')->nullable();
            $table->string('status')->default('confirmed');
            $table->boolean('is_published')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('is_published');
            $table->index('weapon_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gta6_weapons');
    }
};
