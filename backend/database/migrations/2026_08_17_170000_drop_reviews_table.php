<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * The `reviews` table, which never held a row.
 *
 * Reviews on this site are Articles in a category of type `reviews` — 38 of
 * them at the time of writing — and they have been for as long as the site has
 * existed. Alongside that, a separate `Review` model, table, policy, observer,
 * broadcast event and Filament resource were built and never used.
 *
 * The emptiness was not harmless. Three live things asked this table questions
 * and got zero back:
 *
 *   - `MediaKitService` reported **zero reviews** to advertisers while counting
 *     those same 38 inside `total_articles`.
 *   - `CommentController` mapped `type=review` to this model, so a comment left
 *     on a review page was stored against a record that does not exist —
 *     `$comment->commentable` was null for every one of them, which is why the
 *     link in the notification had no slug.
 *   - `TrackingController` had a branch for it that could never be reached.
 *
 * All of that is repaired in the same change. What is left is the table.
 *
 * Verified before writing this: `SELECT count(*) FROM reviews` = 0, and all 19
 * comments in production are already `App\Models\Article`. Nothing to migrate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('reviews');
    }

    /**
     * Deliberately empty.
     *
     * Recreating the table would recreate an empty shell of a feature that was
     * never built, and the model that read it no longer exists. If reviews ever
     * do need their own table rather than a category of Article, that is a
     * design decision with its own migration — not a rollback of this one.
     */
    public function down(): void
    {
        //
    }
};
