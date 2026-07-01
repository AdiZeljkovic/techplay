<?php

namespace App\Notifications;

use App\Models\Thread;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MentionNotification extends Notification
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
