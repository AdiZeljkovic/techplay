<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `comments.parent_id` pointed at another comment and was never told to.
 *
 * Deleting a comment left its replies behind with a parent that no longer
 * exists. They are then invisible: the listing fetches top-level comments and
 * reaches replies through the parent, so nothing ever loads them again. They
 * stay in the table forever and keep counting toward comment achievements.
 * Cascade is the right rule — a reply without the thing it replies to is not
 * content, it is debris.
 *
 * Cleans up first: adding a constraint to a table that already violates it
 * fails, and production may hold rows this machine does not.
 *
 * `users.rank_id` was going to be fixed here too and deliberately is not. It is
 * NOT NULL with a hardcoded default of 1, so a foreign key cannot use
 * nullOnDelete, and every user claims rank 1 from the moment they register —
 * before any rank exists on a fresh database, and before they have earned one.
 * That is a product question (does a user with no XP hold a rank at all?), not
 * a constraint to bolt on. The exposure is small: every read of the relation is
 * null-guarded and XpService::checkRankUpdate reassigns on the next award.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Orphaned replies, deepest first — a reply can itself be a parent.
        for ($pass = 0; $pass < 5; $pass++) {
            $removed = DB::table('comments')
                ->whereNotNull('parent_id')
                ->whereNotIn('parent_id', DB::table('comments')->select('id'))
                ->delete();

            if ($removed === 0) {
                break;
            }
        }

        Schema::table('comments', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('comments')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });
    }
};
