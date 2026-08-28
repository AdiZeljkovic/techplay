<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageSeo;
use App\Models\SiteSetting;
use App\Services\CacheService;
use App\Services\ImageDimensionService;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Share cards render before the image is fetched only if the card knows the
     * image's shape up front.
     *
     * og:image went out with no og:image:width/height, so every scraper had to
     * download the file to learn it was 965x541 — and until it did, the card
     * either held the layout back or guessed square and cropped the artwork.
     * The dimensions are measured here rather than stored in a column: there is
     * one default image and 44 page rows, all behind TTL_LONG and all
     * invalidated by SiteSettingObserver / PageSeoObserver on save. Articles
     * and guides earned columns because there are 632 of them and a batch job
     * to fill them; 45 measurements inside an existing cache do not.
     */
    public function index(ImageDimensionService $dimensions)
    {
        $settings = Cache::remember('settings.all', CacheService::TTL_LONG, function () use ($dimensions) {
            $values = SiteSetting::all()->pluck('value', 'key');

            if ($size = $dimensions->measure($values['seo_og_image_default'] ?? null)) {
                $values['seo_og_image_default_width'] = (string) $size[0];
                $values['seo_og_image_default_height'] = (string) $size[1];
            }

            return $values;
        });

        return response()->json($settings);
    }

    public function grouped()
    {
        $settings = Cache::remember('settings.grouped', CacheService::TTL_LONG, function () {
            return SiteSetting::all()->groupBy('group')->map(function ($group) {
                return $group->pluck('value', 'key');
            });
        });

        return response()->json($settings);
    }

    /**
     * Get all page SEO data
     */
    public function pageSeo()
    {
        $pages = Cache::remember('page_seo.all', CacheService::TTL_LONG, function () {
            return PageSeo::all();
        });

        return response()->json($pages);
    }

    /**
     * Get SEO data for a specific page path
     */
    public function pageSeoByPath(string $path, ImageDimensionService $dimensions)
    {
        $path = '/'.ltrim($path, '/');
        $cacheKey = 'page_seo.path.'.md5($path);

        $pageSeo = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($path, $dimensions) {
            $row = PageSeo::where('page_path', $path)->first();

            // 42 of the 44 rows carry their own og_image, so this is the common
            // path, not the exception.
            if ($row && ($size = $dimensions->measure($row->og_image))) {
                $row->og_image_width = $size[0];
                $row->og_image_height = $size[1];
            }

            return $row;
        });

        if (! $pageSeo) {
            return response()->json(['message' => 'Page SEO not found'], 404);
        }

        return response()->json($pageSeo);
    }
}
