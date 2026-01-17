<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageSeo extends Model
{
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
