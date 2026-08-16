<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * One place that knows how the forum's cached reads are named and retired.
 *
 * This existed twice — once in ForumController, once in ThreadObserver — and
 * both copies walked page numbers one to twenty, forgetting each key by name.
 * That left every tag-filtered view of a board serving stale rows, because no
 * loop over page numbers can guess `.tag_hdr` on the end. Two copies also meant
 * a fix to one was not a fix to the other.
 *
 * A board's cached pages carry a version in their key, so raising the version
 * retires all of them at once — every page, every tag filter, whatever they
 * happened to be called.
 */
final class ForumCache
{
    /**
     * Starts at zero, not one, and the distinction is load-bearing: a store
     * asked to increment a key it does not have sets it to the increment — one
     * — so a default of one meant the very first invalidation moved the version
     * from one to one and changed no key at all. Caught by the test below it.
     */
    public static function categoryVersion(string $categorySlug): int
    {
        return (int) Cache::get(self::versionKey($categorySlug), 0);
    }

    public static function categoryKey(string $categorySlug, int|string $page, ?string $tagSlug = null): string
    {
        $version = self::categoryVersion($categorySlug);

        return "forum.category.{$categorySlug}.v{$version}.page_{$page}".($tagSlug ? ".tag_{$tagSlug}" : '');
    }

    /** Retire every cached page of one board. */
    public static function forgetCategory(string $categorySlug): void
    {
        $key = self::versionKey($categorySlug);

        // Stores disagree about incrementing a key that does not exist yet, so
        // the miss is handled rather than assumed either way.
        if (Cache::increment($key) === false) {
            Cache::forever($key, self::categoryVersion($categorySlug) + 1);
        }
    }

    /** The lists and counters that any write to any thread can move. */
    public static function forgetShared(): void
    {
        Cache::forget('forum.stats');
        Cache::forget('forum.categories');
        Cache::forget('forum.active_threads');
        Cache::forget('forum.unanswered_threads');
    }

    public static function forgetThread(string $threadSlug): void
    {
        Cache::forget("forum.thread.{$threadSlug}");
    }

    private static function versionKey(string $categorySlug): string
    {
        return "forum.category.{$categorySlug}.v";
    }
}
