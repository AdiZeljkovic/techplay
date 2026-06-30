<?php

namespace App\Notifications;

use App\Models\Quest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class QuestCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(protected Quest $quest) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'quest_completed',
            'title' => 'Quest Completed!',
            'message' => "You completed \"{$this->quest->name}\"".($this->quest->bounty_reward ? " (+{$this->quest->bounty_reward} bounty)" : ''),
            'quest_name' => $this->quest->name,
            'bounty_reward' => $this->quest->bounty_reward,
            'xp_reward' => $this->quest->xp_reward,
            'link' => "/profile/{$notifiable->username}",
        ];
    }
}
