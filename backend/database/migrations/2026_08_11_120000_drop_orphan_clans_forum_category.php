<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The clan system was removed on 11 Aug 2026, and its private boards with it.
 * The group they hung under stayed: a "Clans" heading on the forum index with
 * nothing beneath it.
 *
 * Deletes it only if it is genuinely empty — no children, no threads. If
 * anything is still attached, the row is left alone and reported, because an
 * empty heading is a smaller problem than deleting somebody's discussion.
 */
return new class extends Migration
{
    public function up(): void
    {
        $category = DB::table('categories')
            ->where('slug', 'clans')
            ->where('type', 'forum')
            ->first();

        if (! $category) {
            echo "No clans forum category — nothing to do.\n";

            return;
        }

        $children = DB::table('categories')->where('parent_id', $category->id)->count();
        $threads = DB::table('threads')->where('category_id', $category->id)->count();

        if ($children > 0 || $threads > 0) {
            echo "Leaving the clans category: {$children} children, {$threads} threads still attached.\n";

            return;
        }

        DB::table('categories')->where('id', $category->id)->delete();

        echo "Dropped the orphan clans forum category (id {$category->id}).\n";
    }
};
