<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('broken_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->string('url', 500);
            $table->integer('status_code')->nullable();
            $table->string('error_message', 255)->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->boolean('is_fixed')->default(false);
            $table->timestamps();

            $table->index(['article_id', 'is_fixed']);
            $table->index('status_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broken_links');
    }
};
