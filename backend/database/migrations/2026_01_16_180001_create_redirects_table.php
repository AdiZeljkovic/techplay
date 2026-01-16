<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('redirects', function (Blueprint $table) {
            $table->id();
            $table->string('source_url', 500)->unique();
            $table->string('target_url', 500);
            $table->integer('status_code')->default(301);
            $table->unsignedBigInteger('hits')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->index('source_url');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redirects');
    }
};
