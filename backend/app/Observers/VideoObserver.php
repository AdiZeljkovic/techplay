<?php

namespace App\Observers;

use App\Events\VideoPublished;
use App\Models\Video;
use Illuminate\Support\Facades\Cache;

class VideoObserver
{
    public function created(Video $video): void
    {
        // Videos are published immediately when created (no status field)
        if ($video->published_at && $video->published_at->isPast()) {
            broadcast(new VideoPublished($video))->toOthers();
        }

        $this->invalidateCache($video);
    }

    public function updated(Video $video): void
    {
        // If published_at was just set or changed to a past date
        if ($video->isDirty('published_at') && $video->published_at && $video->published_at->isPast()) {
            broadcast(new VideoPublished($video))->toOthers();
        }

        $this->invalidateCache($video);
    }

    public function deleted(Video $video): void
    {
        $this->invalidateCache($video);
    }

    /**
     * Invalidate video cache when video changes
     */
    protected function invalidateCache(Video $video): void
    {
        // Clear specific video cache
        Cache::forget("videos.{$video->slug}");

        // Clear video listing cache (first 5 pages)
        for ($page = 1; $page <= 5; $page++) {
            Cache::forget("videos.page_{$page}");
        }
    }
}
