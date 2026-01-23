<?php

namespace App\Observers;

use App\Events\ThreadCreated;
use App\Models\Thread;
use Illuminate\Support\Facades\Cache;

class ThreadObserver
{
    public function created(Thread $thread): void
    {
        broadcast(new ThreadCreated($thread))->toOthers();
        $this->invalidateForumCache($thread);
    }

    public function updated(Thread $thread): void
    {
        $this->invalidateForumCache($thread);
    }

    public function deleted(Thread $thread): void
    {
        $this->invalidateForumCache($thread);
    }

    /**
     * Invalidate forum cache when thread changes
     */
    protected function invalidateForumCache(Thread $thread): void
    {
        // Clear forum statistics
        Cache::forget('forum.stats');

        // Clear categories list
        Cache::forget('forum.categories');

        // Clear active threads
        Cache::forget('forum.active_threads');

        // Clear category-specific cache (first 5 pages)
        if ($thread->category) {
            $categorySlug = $thread->category->slug;
            for ($page = 1; $page <= 5; $page++) {
                Cache::forget("forum.category.{$categorySlug}.page_{$page}");
            }
        }

        // Clear specific thread cache
        Cache::forget("forum.thread.{$thread->slug}");
    }
}
