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
        Schema::table('editorial_messages', function (Blueprint $table) {
            $table->string('channel')->nullable()->default('general')->after('user_id');
            $table->foreignId('recipient_id')->nullable()->after('channel')->constrained('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('editorial_messages', function (Blueprint $table) {
            //
        });
    }
};
