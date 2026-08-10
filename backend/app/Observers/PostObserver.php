<?php

namespace App\Observers;

use App\Models\Post;
use App\Services\AchievementService;
use App\Services\XpService;

class PostObserver
{
    /**
     * Handle the Post "created" event.
     */
    public function created(Post $post): void
    {
        if (! $post->relationLoaded('author')) {
            $post->load('author');
        }

        $user = $post->author;
        if (! $user) {
            return;
        }

        // Reputation is independent of XP (community standing signal)
        $user->increment('forum_reputation', 5);

        // XP through the single service path: daily cap, bounty mirror,
        // season multiplier and rank check all apply consistently
        app(XpService::class)->awardXp($user, 20, 'forum_post');

        // Achievements through the central service (criteria-driven),
        // replacing the old hardcoded "First Steps"/"Active Voice" unlocks
        try {
            app(AchievementService::class)->check($user, ['posts_count']);
        } catch (\Throwable) {
        }
    }

    /**
     * Handle the Post "updated" event.
     */
    public function updated(Post $post): void
    {
        //
    }

    /**
     * Handle the Post "deleted" event.
     */
    public function deleted(Post $post): void
    {
        $post->author?->decrement('forum_reputation', 5);
    }

    /**
     * Handle the Post "restored" event.
     */
    public function restored(Post $post): void
    {
        // Deleting took 5 away; restoring gave nothing back, so a post removed
        // by mistake and put back left its author permanently short.
        $post->author?->increment('forum_reputation', 5);
    }

    /**
     * Handle the Post "force deleted" event.
     */
    public function forceDeleted(Post $post): void
    {
        //
    }
}
