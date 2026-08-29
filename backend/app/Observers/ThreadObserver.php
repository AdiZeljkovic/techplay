<?php

namespace App\Observers;

use App\Events\ThreadCreated;
use App\Models\Thread;
use App\Services\AchievementService;
use App\Services\QuestService;
use App\Services\SanitizationService;
use App\Services\XpService;
use App\Support\ForumCache;
use Illuminate\Support\Facades\Log;

class ThreadObserver
{
    /** Title and body both, and from either door — see CommentObserver. */
    public function saving(Thread $thread): void
    {
        $sanitizer = app(SanitizationService::class);

        if ($thread->isDirty('title') && is_string($thread->title)) {
            $thread->title = $sanitizer->sanitizeTitle($thread->title);
        }

        if ($thread->isDirty('content') && is_string($thread->content)) {
            $thread->content = $sanitizer->sanitizeRichContent($thread->content);
        }
    }

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
     * Threads are soft-deleted as of 2026-08-16, so removal is reversible — and
     * the three reputation taken back above has to be reversible with it, or
     * restoring a thread quietly costs its author points they earned.
     */
    public function restored(Thread $thread): void
    {
        try {
            if (! $thread->relationLoaded('author')) {
                $thread->load('author');
            }

            $thread->author?->increment('forum_reputation', 3);
        } catch (\Throwable $e) {
            Log::warning('Thread restore reputation adjustment failed: '.$e->getMessage(), [
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
     * Invalidate forum cache when thread changes.
     *
     * This used to be its own copy of the controller's key-forgetting loop, and
     * carried the same defect: walking page numbers cannot name a key that ends
     * in `.tag_something`. Both now go through ForumCache, so a fix is a fix in
     * one place.
     */
    protected function invalidateForumCache(Thread $thread): void
    {
        ForumCache::forgetShared();

        if ($thread->category) {
            ForumCache::forgetCategory($thread->category->slug);
        }

        ForumCache::forgetThread($thread->slug);
    }
}
