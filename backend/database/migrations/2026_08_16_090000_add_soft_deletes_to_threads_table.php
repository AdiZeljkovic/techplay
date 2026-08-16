<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting a thread was the one irreversible act on the forum.
 *
 * Replies have been soft-deleted since March — a moderator who removes the
 * wrong one restores it. The thread they hang off had no such thing: the row
 * went, and the foreign key took every reply with it. So the cheaper mistake
 * was recoverable and the expensive one was not, which is backwards.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('threads', 'deleted_at')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->softDeletes();

                // Every board listing filters on it, so it is worth an index of
                // its own rather than a full scan per page.
                $table->index('deleted_at');
            });
        }
    }

    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
            $table->dropSoftDeletes();
        });
    }
};
