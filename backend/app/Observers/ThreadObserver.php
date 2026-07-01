<?php

namespace App\Observers;

use App\Events\ThreadCreated;
use App\Models\Thread;
use App\Services\AchievementService;
use App\Services\XpService;
use Illuminate\Support\Facades\Cache;

class ThreadObserver
{
    public function created(Thread $thread): void
    {
        broadcast(new ThreadCreated($thread))->toOthers();
        $this->invalidateForumCache($thread);
        $this->awardThreadCreationRewards($thread);
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
     * Award XP/reputation for starting a discussion, mirroring PostObserver's
     * reply rewards so thread creation isn't worth zero engagement points.
     */
    protected function awardThreadCreationRewards(Thread $thread): void
    {
        if (! $thread->relationLoaded('author')) {
            $thread->load('author');
        }

        $user = $thread->author;
        if (! $user) {
            return;
        }

        $user->increment('forum_reputation', 3);
        app(XpService::class)->awardXp($user, 15, 'forum_thread');

        try {
            app(AchievementService::class)->check($user, ['threads_count', 'reputation']);
        } catch (\Throwable) {
        }
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

        // Clear unanswered threads list (new threads start with zero replies)
        Cache::forget('forum.unanswered_threads');

        // Clear category-specific cache (wider than typical page count to avoid stale pages)
        if ($thread->category) {
            $categorySlug = $thread->category->slug;
            for ($page = 1; $page <= 20; $page++) {
                Cache::forget("forum.category.{$categorySlug}.page_{$page}");
            }
        }

        // Clear specific thread cache
        Cache::forget("forum.thread.{$thread->slug}");
    }
}
