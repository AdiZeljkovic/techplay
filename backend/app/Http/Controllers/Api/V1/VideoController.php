<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VideoController extends Controller
{
    public function index()
    {
        $page = request()->get('page', 1);
        $cacheKey = "videos.page_{$page}";

        $videos = Cache::remember($cacheKey, CacheService::TTL_LONG, function () {
            $videos = Video::orderBy('published_at', 'desc')->paginate(12);

            // Transform collection to ensure accessors are appended if need be
            $videos->getCollection()->transform(function ($video) {
                // Accessing the attribute to ensure any appends work if not automatically done
                $video->youtube_id = $video->youtube_id;
                return $video;
            });

            return $videos;
        });

        return response()->json($videos)->header('Cache-Control', 'public, max-age=3600');
    }

    public function show($slug)
    {
        $cacheKey = "videos.{$slug}";

        $video = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($slug) {
            $video = Video::where('slug', $slug)->firstOrFail();
            $video->youtube_id = $video->youtube_id; // Trigger accessor
            return $video;
        });

        return response()->json($video)->header('Cache-Control', 'public, max-age=3600');
    }
}
