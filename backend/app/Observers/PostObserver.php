<?php

namespace App\Observers;

use App\Models\Post;

class PostObserver
{
    /**
     * Handle the Post "created" event.
     */
    public function created(Post $post): void
    {
        $user = $post->author;
        if (!$user)
            return;

        // 1. Award Points
        $user->increment('forum_reputation', 5);
        $user->increment('xp', 20);

        // 2. Check Rank Upgrade
        $newRank = \App\Models\Rank::where('min_reputation', '<=', $user->forum_reputation)
            ->orderBy('min_reputation', 'desc')
            ->first();

        if ($newRank && $user->rank_id !== $newRank->id) {
            $user->update(['rank_id' => $newRank->id]);
        }

        // 3. Check Achievements
        $postCount = $user->posts()->count();

        // "First Steps" - First Post
        if ($postCount === 1) {
            $this->unlockAchievement($user, 'First Steps');
        }

        // "Active Voice" - 10 Posts
        if ($postCount === 10) {
            $this->unlockAchievement($user, 'Active Voice');
        }
    }

    protected function unlockAchievement($user, $name)
    {
        $achievement = \App\Models\Achievement::where('name', $name)->first();
        if ($achievement) {
            if (!$user->achievements()->where('achievement_id', $achievement->id)->exists()) {
                $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);
            }
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
        $post->author->decrement('forum_reputation', 5);
    }

    /**
     * Handle the Post "restored" event.
     */
    public function restored(Post $post): void
    {
        //
    }

    /**
     * Handle the Post "force deleted" event.
     */
    public function forceDeleted(Post $post): void
    {
        //
    }
}
