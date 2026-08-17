<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PageSeo extends Model
{
    /**
     * Drop the cached copies of one page's SEO.
     *
     * The endpoint caches under two keys for an hour — `page_seo.all` and
     * `page_seo.path.<md5 of the path>` — and knowing that was spread across
     * the admin pages. Two console commands guessed at it, forgot keys that do
     * not exist, and wrote correct rows that the API then served stale for an
     * hour while everybody rebuilt the frontend wondering why nothing changed.
     */
    public static function forgetCache(?string $path = null): void
    {
        Cache::forget('page_seo.all');

        if ($path !== null) {
            Cache::forget('page_seo.path.'.md5('/'.ltrim($path, '/')));
        }
    }

    protected $table = 'page_seo';

    protected $fillable = [
        'page_path',
        'page_name',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_title',
        'og_description',
        'og_image',
        'canonical_url',
        'is_noindex',
        'seo_text',
    ];

    protected $casts = [
        'is_noindex' => 'boolean',
    ];

    /**
     * Get SEO data for a specific page path
     */
    public static function getForPath(string $path): ?self
    {
        return static::where('page_path', $path)->first();
    }

    /**
     * Get all page SEO as array keyed by path
     */
    public static function getAllAsArray(): array
    {
        return static::all()->keyBy('page_path')->toArray();
    }
}
