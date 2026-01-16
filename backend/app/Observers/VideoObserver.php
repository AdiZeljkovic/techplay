<?php

namespace App\Observers;

use App\Events\VideoPublished;
use App\Models\Video;

class VideoObserver
{
    public function created(Video $video): void
    {
        // Videos are published immediately when created (no status field)
        if ($video->published_at && $video->published_at->isPast()) {
            broadcast(new VideoPublished($video))->toOthers();
        }
    }

    public function updated(Video $video): void
    {
        // If published_at was just set or changed to a past date
        if ($video->isDirty('published_at') && $video->published_at && $video->published_at->isPast()) {
            broadcast(new VideoPublished($video))->toOthers();
        }
    }
}
