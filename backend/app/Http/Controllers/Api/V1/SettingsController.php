<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\PageSeo;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Cache::remember('settings.all', CacheService::TTL_LONG, function () {
            return SiteSetting::all()->pluck('value', 'key');
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
    public function pageSeoByPath(string $path)
    {
        $path = '/' . ltrim($path, '/');
        $cacheKey = "page_seo.path." . md5($path);

        $pageSeo = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($path) {
            return PageSeo::where('page_path', $path)->first();
        });

        if (!$pageSeo) {
            return response()->json(['message' => 'Page SEO not found'], 404);
        }

        return response()->json($pageSeo);
    }
}

