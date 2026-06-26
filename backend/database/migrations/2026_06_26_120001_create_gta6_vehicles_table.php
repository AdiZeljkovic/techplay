<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gta6_vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('vehicle_class')->nullable(); // Sports, Sedan, Motorcycle, Boat, Aircraft...
            $table->string('real_equivalent')->nullable(); // real-world inspiration
            $table->text('description')->nullable();
            $table->string('image', 1000)->nullable();
            $table->json('gallery')->nullable();
            $table->string('status')->default('confirmed');
            $table->boolean('is_published')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('is_published');
            $table->index('vehicle_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gta6_vehicles');
    }
};
