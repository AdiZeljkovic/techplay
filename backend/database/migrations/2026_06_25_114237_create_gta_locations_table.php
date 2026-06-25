<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gta_locations', function (Blueprint $table) {
            $table->id();
            $table->string('gtadb_key', 10)->unique();
            $table->string('name');
            $table->decimal('game_x', 12, 4)->nullable();
            $table->decimal('game_y', 12, 4)->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->text('real_address')->nullable();
            $table->json('categories');
            $table->boolean('is_unconfirmed')->default(false);
            $table->timestamps();

            $table->index(['lat', 'lng']);
            $table->index('is_unconfirmed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gta_locations');
    }
};
