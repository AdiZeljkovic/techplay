<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ThreadWatchNotification extends Notification
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
            'type' => 'thread_watch',
            'thread_id' => $this->thread->id,
            'thread_slug' => $this->thread->slug,
            'thread_title' => $this->thread->title,
            'replier_name' => $this->replier->display_name ?? $this->replier->username,
            'post_preview' => substr(strip_tags($this->post->content), 0, 100),
        ];
    }
}
