<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Collection;

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

    /**
     * Forget all keys matching a pattern
     */
    public static function forgetPattern(string $prefix): void
    {
        // Note: This works with Redis. For file cache, use tags or manual cleanup.
        // For now, we'll use specific keys
        Cache::flush(); // Be careful with this in production!
    }

    /**
     * Clear home page cache
     */
    public static function clearHomeCache(): void
    {
        self::forget(self::PREFIX_HOME . 'data');
        self::forget(self::PREFIX_HOME . 'featured');
    }

    /**
     * Clear news cache
     */
    public static function clearNewsCache(): void
    {
        self::forget(self::PREFIX_NEWS . 'list');
        self::forget(self::PREFIX_NEWS . 'latest');
    }

    /**
     * Clear reviews cache
     */
    public static function clearReviewsCache(): void
    {
        self::forget(self::PREFIX_REVIEWS . 'list');
        self::forget(self::PREFIX_REVIEWS . 'featured');
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
}
