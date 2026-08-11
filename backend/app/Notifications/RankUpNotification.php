<?php

namespace App\Notifications;

use App\Models\Rank;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RankUpNotification extends Notification
{
    use Queueable;

    public function __construct(protected Rank $rank) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'rank_up',
            'title' => "You reached {$this->rank->name}!",
            'message' => 'Congrats! Keep engaging to climb even higher.',
            'rank' => $this->rank->name,
            'icon' => $this->rank->icon ?? null,
            'color' => $this->rank->color ?? null,
            'link' => "/profile/{$notifiable->username}",
        ];
    }
}
