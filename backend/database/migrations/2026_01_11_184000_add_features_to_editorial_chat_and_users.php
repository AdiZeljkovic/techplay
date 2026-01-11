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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable();
            }
        });

        Schema::table('editorial_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('editorial_messages', 'mentioned_user_ids')) {
                $table->json('mentioned_user_ids')->nullable();
            }
            if (!Schema::hasColumn('editorial_messages', 'attachment_url')) {
                $table->string('attachment_url')->nullable();
            }
            if (!Schema::hasColumn('editorial_messages', 'is_pinned')) {
                $table->boolean('is_pinned')->default(false);
            }
            if (!Schema::hasColumn('editorial_messages', 'read_at')) {
                $table->timestamp('read_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('last_seen_at');
        });

        Schema::table('editorial_messages', function (Blueprint $table) {
            $table->dropColumn(['mentioned_user_ids', 'attachment_url', 'is_pinned', 'read_at']);
        });
    }
};
