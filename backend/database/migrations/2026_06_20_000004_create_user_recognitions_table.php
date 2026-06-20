<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_recognitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 20); // helpful | insightful | friendly | leader
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['giver_id', 'receiver_id', 'type']);
            $table->index('receiver_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_recognitions');
    }
};
