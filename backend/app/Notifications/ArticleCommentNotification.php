<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ArticleCommentNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Comment $comment,
        protected User $commenter,
        protected string $contentTitle,
        protected string $contentLink
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $name = $this->commenter->display_name ?? $this->commenter->username;

        return [
            'type' => 'article_comment',
            'title' => "{$name} commented on your article",
            'message' => Str::limit($this->comment->content, 100),
            'content_title' => $this->contentTitle,
            'sender_username' => $this->commenter->username,
            'sender_avatar_url' => $this->commenter->avatar_url ?? null,
            'link' => $this->contentLink,
        ];
    }
}
