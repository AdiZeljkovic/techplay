<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rewritten 17 Aug 2026, when Editorial Chat was removed.
 *
 * This migration did two unrelated jobs under one name: it added four columns
 * to `editorial_messages` and, incidentally, `users.last_seen_at`. The chat and
 * its tables are gone, and the other nine editorial migrations went with them —
 * but `last_seen_at` is nothing to do with the chat. It is how the platform
 * knows who has been active, and dropping this file would have quietly removed
 * that column from every database built from scratch afterwards.
 *
 * So the editorial half is deleted and the users half stays. The `hasColumn`
 * guard is kept: an existing database already has the column and must not be
 * asked to add it twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('last_seen_at');
        });
    }
};
