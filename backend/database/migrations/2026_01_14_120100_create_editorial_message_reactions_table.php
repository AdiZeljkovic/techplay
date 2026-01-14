<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('editorial_message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('editorial_message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji'); // The emoji character itself
            $table->timestamps();

            // Prevent duplicate reaction from same user on same message with same emoji
            $table->unique(['editorial_message_id', 'user_id', 'emoji'], 'unique_user_reaction');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('editorial_message_reactions');
    }
};
