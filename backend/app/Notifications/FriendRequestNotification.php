<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FriendRequestNotification extends Notification
{
    use Queueable;

    public function __construct(protected User $sender, protected string $action = 'sent') {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $name = $this->sender->display_name ?? $this->sender->username;

        return [
            'type' => 'friend_request',
            'title' => $this->action === 'accepted' ? 'Friend Request Accepted' : 'New Friend Request',
            'message' => $this->action === 'accepted'
                ? "{$name} accepted your friend request"
                : "{$name} sent you a friend request",
            'sender_username' => $this->sender->username,
            'sender_avatar_url' => $this->sender->avatar_url,
            'link' => '/friends',
        ];
    }
}
