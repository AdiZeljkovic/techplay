<?php

namespace App\Observers;

use App\Events\GuidePublished;
use App\Models\Guide;

class GuideObserver
{
    public function created(Guide $guide): void
    {
        if ($guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
        }
    }

    public function updated(Guide $guide): void
    {
        if ($guide->isDirty('status') && $guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
        }
    }
}
