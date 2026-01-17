<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\PageSeo;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function grouped()
    {
        $settings = SiteSetting::all()->groupBy('group')->map(function ($group) {
            return $group->pluck('value', 'key');
        });
        return response()->json($settings);
    }

    /**
     * Get all page SEO data
     */
    public function pageSeo()
    {
        $pages = PageSeo::all();
        return response()->json($pages);
    }

    /**
     * Get SEO data for a specific page path
     */
    public function pageSeoByPath(string $path)
    {
        $path = '/' . ltrim($path, '/');
        $pageSeo = PageSeo::where('page_path', $path)->first();

        if (!$pageSeo) {
            return response()->json(['message' => 'Page SEO not found'], 404);
        }

        return response()->json($pageSeo);
    }
}

