<?php

namespace App\Notifications;

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
class MentionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Thread $thread,
        protected User $mentioner,
        protected string $preview,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'forum_mention',
            'thread_id' => $this->thread->id,
            'thread_slug' => $this->thread->slug,
            'thread_title' => $this->thread->title,
            'mentioner_name' => $this->mentioner->display_name ?? $this->mentioner->username,
            'post_preview' => $this->preview,
        ];
    }
}
