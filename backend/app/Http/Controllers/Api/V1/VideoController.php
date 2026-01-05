<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function index()
    {
        $page = request()->get('page', 1);
        return \Illuminate\Support\Facades\Cache::remember("videos.page_{$page}", 3600, function () {
            $videos = Video::orderBy('published_at', 'desc')->paginate(12);

            // Transform collection to ensure accessors are appended if need be
            $videos->getCollection()->transform(function ($video) {
                // Accessing the attribute to ensure any appends work if not automatically done
                $video->youtube_id = $video->youtube_id;
                return $video;
            });

            return $videos;
        });
    }

    public function show($slug)
    {
        return \Illuminate\Support\Facades\Cache::remember("videos.{$slug}", 3600, function () use ($slug) {
            $video = Video::where('slug', $slug)->firstOrFail();
            $video->youtube_id = $video->youtube_id; // Trigger accessor
            return $video;
        });
    }
}
