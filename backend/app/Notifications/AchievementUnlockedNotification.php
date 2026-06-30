<?php

namespace App\Notifications;

use App\Models\Achievement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AchievementUnlockedNotification extends Notification
{
    use Queueable;

    public function __construct(protected Achievement $achievement) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'achievement',
            'title' => 'Achievement Unlocked!',
            'message' => $this->achievement->name,
            'description' => $this->achievement->description,
            'points' => $this->achievement->points,
            'icon_path' => $this->achievement->icon_path,
            'link' => "/profile/{$notifiable->username}",
        ];
    }
}
