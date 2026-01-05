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
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->nullableMorphs('commentable'); // article_id, video_id, etc.
            $table->text('content');
            $table->string('status')->default('approved'); // approved, pending, spam, rejected
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->integer('likes_count')->default(0);
            $table->timestamps();

            // Index for fast lookups
            $table->index(['commentable_type', 'commentable_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
