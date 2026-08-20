<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Cache Service
 * Centralized caching logic for API responses.
 *
 * Usage:
 * $data = CacheService::remember('home_data', fn() => $this->getHomeData());
 */
class CacheService
{
    // Cache TTL in seconds
    const TTL_SHORT = 60;          // 1 minute

    const TTL_MEDIUM = 300;        // 5 minutes

    const TTL_LONG = 3600;         // 1 hour

    const TTL_DAY = 86400;         // 24 hours

    const TTL_WEEK = 604800;       // 7 days (for realm list, rarely changes)

    // Cache key prefixes
    const PREFIX_API = 'api:';

    const PREFIX_HOME = 'home:';

    const PREFIX_NEWS = 'news:';

    const PREFIX_REVIEWS = 'reviews:';

    const PREFIX_USER = 'user:';

    /**
     * Remember a value in cache
     */
    public static function remember(string $key, callable $callback, int $ttl = self::TTL_MEDIUM): mixed
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Forget a cached value
     */
    public static function forget(string $key): bool
    {
        return Cache::forget($key);
    }

    /*
     * ── Article caches ────────────────────────────────────────────────────
     *
     * One place where an article cache key is spelled, because the last time
     * there were two the site quietly stopped showing edits. A controller was
     * bumped to write `news.show.v3.{slug}` while the observer went on clearing
     * `news.show.v2.{slug}`; nothing failed and nothing was logged. A
     * journalist added a picture to a published article, saved it, and the page
     * kept serving the hour-old copy without one. Reviews and every listing had
     * drifted the same way.
     *
     * What stood here before was worse than the drift: a `forgetPattern($prefix)`
     * that ignored its argument and called `Cache::flush()`, beside three
     * clearXCache() helpers. Nothing in the application called any of them, so
     * the cache was never actually emptied — but the next person to reach for
     * the obvious-looking method would have emptied all of it under live
     * traffic. Removed rather than repaired: the store is `file`, which has no
     * prefix scan to implement them with.
     */

    /** Bump this once and every reader and writer moves together. */
    public const ARTICLE_VERSION = 'v3';

    /**
     * Sections backed by the Article model. One article may be reachable under
     * any of them, so clearing it clears all three.
     *
     * Guides are not here: they are their own model with their own observer,
     * and their key is the singular `guide.show.…`. They never drifted.
     */
    public const ARTICLE_TYPES = ['news', 'tech', 'reviews'];

    /** Sections with cached listings. Guides have one, even though they are not Articles. */
    public const LISTING_TYPES = ['news', 'tech', 'reviews', 'guides'];

    /** The cached single article — bounded by slug, so it clears exactly. */
    public static function articleShowKey(string $type, string $slug): string
    {
        return "{$type}.show.".self::ARTICLE_VERSION.".{$slug}";
    }

    /**
     * The same arrangement for games, for the same reason.
     *
     * `games.show.v4.{slug}` was spelled out in four places across the observer
     * and the controller — the exact shape that let the article key drift. It
     * is v5 now because the payload gained the linked studios, and a reader
     * holding a v4 copy would show a game page with nowhere to click.
     */
    public const GAME_VERSION = 'v5';

    public static function gameShowKey(string $slug): string
    {
        return 'games.show.'.self::GAME_VERSION.".{$slug}";
    }

    /**
     * Listing keys carry a page, a category and an md5 of the search term, so
     * they cannot be enumerated the way a slug can. Each is recorded here as it
     * is written, and that record is what invalidation reads.
     *
     * Redis would answer this with a prefix scan. The file store cannot, and
     * `CACHE_STORE=file` is what this site actually runs — the docs said Redis
     * for months. A register is the portable answer, and it reaches the search-
     * and category-filtered variants that the old hand-listed `Cache::forget`
     * calls never touched.
     */
    public static function rememberListingKey(string $type, string $key): void
    {
        $registry = "listing-keys.{$type}";
        $keys = Cache::get($registry, []);

        if (! in_array($key, $keys, true)) {
            $keys[] = $key;
            // A day outlives any listing TTL, so the register never claims less
            // than the cache holds. Capped, because a crawler walking ?search=
            // would otherwise grow it without end.
            Cache::put($registry, array_slice($keys, -500), self::TTL_DAY);
        }
    }

    /** Drop one article from every section that could be serving it. */
    public static function forgetArticle(string $slug): void
    {
        foreach (self::ARTICLE_TYPES as $type) {
            Cache::forget(self::articleShowKey($type, $slug));
        }
    }

    /** Drop every listing recorded for a section, or for all of them. */
    public static function forgetListings(?string $type = null): void
    {
        foreach ($type ? [$type] : self::LISTING_TYPES as $section) {
            $registry = "listing-keys.{$section}";

            foreach (Cache::get($registry, []) as $key) {
                Cache::forget($key);
            }

            Cache::forget($registry);
        }
    }

    /**
     * Generate a unique cache key for paginated requests
     */
    public static function paginatedKey(string $prefix, int $page, int $perPage, ?string $filter = null): string
    {
        $key = "{$prefix}page:{$page}:per:{$perPage}";
        if ($filter) {
            $key .= ":filter:{$filter}";
        }

        return $key;
    }

    // ========================================================================
    // ADMIN PANEL DROPDOWN CACHING
    // ========================================================================

    const PREFIX_ADMIN = 'admin:';

    const TTL_ADMIN_DROPDOWN = 3600; // 1 hour for admin dropdowns

    /**
     * Get cached authors for Filament dropdown
     * Returns: ['id' => 'display_name', ...]
     */
    public static function getAuthors(): array
    {
        return self::remember(self::PREFIX_ADMIN.'authors', function () {
            return User::role(['Super Admin', 'Editor', 'Editor-in-Chief', 'Journalist', 'Moderator'])
                ->get()
                ->mapWithKeys(fn ($user) => [$user->id => $user->display_name ?: $user->username])
                ->toArray();
        }, self::TTL_ADMIN_DROPDOWN);
    }

    /**
     * Get cached categories for Filament dropdown
     * Returns: ['id' => 'name', ...]
     */
    public static function getCategories(): array
    {
        return self::remember(self::PREFIX_ADMIN.'categories', function () {
            return Category::orderBy('type')->orderBy('name')
                ->get()
                ->mapWithKeys(fn ($category) => [$category->id => $category->name.' ('.$category->type.')'])
                ->toArray();
        }, self::TTL_ADMIN_DROPDOWN);
    }

    /**
     * Clear admin dropdown caches
     * Call this when users or roles are updated
     */
    public static function clearAdminDropdowns(): void
    {
        self::forget(self::PREFIX_ADMIN.'authors');
        self::forget(self::PREFIX_ADMIN.'categories');
    }
}
