<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Queued, because the caller sends these in a loop.
 *
 * A reply notifies the thread's author and then every watcher, one by one, in
 * the request that posted it. On a thread with fifty watchers that was fifty
 * synchronous writes before the poster saw their own reply appear — the busier
 * a thread got, the slower it became to take part in.
 */
class ForumReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Post $post,
        protected Thread $thread,
        protected User $replier,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'forum_reply',
            'thread_id' => $this->thread->id,
            'thread_slug' => $this->thread->slug,
            'thread_title' => $this->thread->title,
            'replier_name' => $this->replier->display_name ?? $this->replier->username,
            'post_preview' => substr(strip_tags($this->post->content), 0, 100),
        ];
    }
}
