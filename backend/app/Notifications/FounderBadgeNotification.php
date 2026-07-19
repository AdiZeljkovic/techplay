<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FounderBadgeNotification extends Notification
{
    use Queueable;

    public function __construct(protected string $badgeName) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'badge_awarded',
            'title' => 'Exclusive badge unlocked!',
            'message' => "You earned the \"{$this->badgeName}\" badge — one of the first fully-built profiles on TechPlay. Equip it from your Rewards tab.",
            'badge_name' => $this->badgeName,
            'link' => "/profile/{$notifiable->username}?tab=rewards",
        ];
    }
}
