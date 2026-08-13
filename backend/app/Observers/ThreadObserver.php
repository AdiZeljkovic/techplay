<?php

namespace App\Observers;

use App\Events\ThreadCreated;
use App\Models\Thread;
use App\Services\AchievementService;
use App\Services\QuestService;
use App\Services\XpService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
        // Creating a thread grants 3 reputation; deleting one gave nothing
        // back, unlike posts, which decrement. So a spam thread stayed
        // profitable on the leaderboard after a moderator removed it.
        try {
            if (! $thread->relationLoaded('author')) {
                $thread->load('author');
            }

            $thread->author?->decrement('forum_reputation', 3);
        } catch (\Throwable $e) {
            Log::warning('Thread deletion reputation adjustment failed: '.$e->getMessage(), [
                'thread_id' => $thread->id,
            ]);
        }

        $this->invalidateForumCache($thread);
    }

    /**
     * Award XP/reputation for starting a discussion, mirroring PostObserver's
     * reply rewards so thread creation isn't worth zero engagement points.
     *
     * Wrapped defensively: this fires inside createThread()'s DB transaction,
     * so any unhandled exception here would roll back and fail the thread
     * creation itself. Rewards are a side effect, never allowed to block it.
     */
    protected function awardThreadCreationRewards(Thread $thread): void
    {
        try {
            if (! $thread->relationLoaded('author')) {
                $thread->load('author');
            }

            $user = $thread->author;
            if (! $user) {
                return;
            }

            $user->increment('forum_reputation', 3);
            app(XpService::class)->awardXp($user, 15, 'forum_thread');
            app(AchievementService::class)->check($user, ['threads_count', 'reputation']);
            app(QuestService::class)->progress($user, 'thread_started');
        } catch (\Throwable $e) {
            Log::warning('Thread creation reward failed: '.$e->getMessage(), ['thread_id' => $thread->id]);
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
