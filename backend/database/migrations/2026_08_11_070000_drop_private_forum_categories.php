<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Deletes the private forum categories, and the flag that marked them.
 *
 * They existed for one reason: a clan owned them and only its members could
 * read them. The clan system is gone, so the previous migration left them
 * behind and hid them from everyone — a holding position, not an answer. This
 * is the answer.
 *
 * Threads cascade from the category, and posts, upvotes, watchers and bookmarks
 * cascade from the thread, so deleting the row takes the whole discussion with
 * it. That is the point, and it cannot be undone: there is no down(), because
 * recreating the categories would not bring back a single post.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('categories', 'is_private')) {
            return;
        }

        // Logged, not silent. On a fresh database this is zero; on production
        // it is however many private clan forums were ever created, and the
        // number is worth seeing in the deploy output before it is gone.
        $ids = DB::table('categories')->where('is_private', true)->pluck('id');

        if ($ids->isNotEmpty()) {
            $threads = DB::table('threads')->whereIn('category_id', $ids)->count();

            echo "  Brisem {$ids->count()} privatnih kategorija i {$threads} tema u njima.".PHP_EOL;

            DB::table('categories')->whereIn('id', $ids)->delete();
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('is_private');
        });
    }
};
