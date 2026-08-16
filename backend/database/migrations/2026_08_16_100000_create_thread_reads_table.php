<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What each member has already read.
 *
 * The forum had no notion of this at all: every visit looked like the first,
 * and the only way to find out whether a thread had moved was to open it and
 * remember. It is the single thing that separates a forum from a list of
 * comments, and it was the largest gap in the whole feature.
 *
 * Two mechanisms, because one is not enough. A row per thread records when you
 * last opened that thread. A watermark on the user records the last time they
 * said "mark everything read" — which is how you dismiss a thousand threads
 * without writing a thousand rows.
 *
 * A thread is unread when its last activity is newer than both.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thread_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('thread_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_read_at');

            // One row per person per thread; the read endpoint upserts on it.
            $table->unique(['user_id', 'thread_id']);

            // The read map is fetched per user, newest first.
            $table->index(['user_id', 'last_read_at']);
        });

        if (! Schema::hasColumn('users', 'forum_last_read_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('forum_last_read_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('thread_reads');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('forum_last_read_at');
        });
    }
};
