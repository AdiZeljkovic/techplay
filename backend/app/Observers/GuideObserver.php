<?php

namespace App\Observers;

use App\Events\GuidePublished;
use App\Models\Guide;
use Illuminate\Support\Facades\Cache;

class GuideObserver
{
    public function created(Guide $guide): void
    {
        if ($guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
        }

        $this->invalidateCache($guide);
    }

    public function updated(Guide $guide): void
    {
        if ($guide->isDirty('status') && $guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
        }

        $this->invalidateCache($guide);
    }

    public function deleted(Guide $guide): void
    {
        $this->invalidateCache($guide);
    }

    /**
     * Invalidate guide cache when guide changes
     */
    protected function invalidateCache(Guide $guide): void
    {
        // Clear specific guide cache
        Cache::forget("guide.show.v2.{$guide->slug}");

        // Clear guide listing cache (first 5 pages, all difficulties, no search)
        for ($page = 1; $page <= 5; $page++) {
            foreach (['all', 'beginner', 'intermediate', 'advanced'] as $diff) {
                $cacheKey = "guides.index.v2.page_{$page}.diff_{$diff}.search_" . md5('');
                Cache::forget($cacheKey);
            }
        }
    }
}
