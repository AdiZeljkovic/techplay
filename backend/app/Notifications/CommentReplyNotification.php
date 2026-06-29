<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class CommentReplyNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Comment $reply,
        protected User $replier,
        protected string $contentLink
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $name = $this->replier->display_name ?? $this->replier->username;

        return [
            'type'             => 'comment_reply',
            'title'            => "{$name} replied to your comment",
            'message'          => Str::limit($this->reply->content, 100),
            'sender_username'  => $this->replier->username,
            'sender_avatar_url'=> $this->replier->avatar_url ?? null,
            'link'             => $this->contentLink,
        ];
    }
}
