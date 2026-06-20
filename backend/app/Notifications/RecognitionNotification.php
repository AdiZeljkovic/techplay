<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RecognitionNotification extends Notification
{
    use Queueable;

    private const LABELS = [
        'helpful' => 'Helpful',
        'insightful' => 'Insightful',
        'friendly' => 'Friendly',
        'leader' => 'Leader',
    ];

    public function __construct(protected User $giver, protected string $type) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $name = $this->giver->display_name ?? $this->giver->username;
        $label = self::LABELS[$this->type] ?? $this->type;

        return [
            'type' => 'recognition',
            'title' => "{$label} Recognition",
            'message' => "{$name} gave you a \"{$label}\" recognition",
            'sender_username' => $this->giver->username,
            'sender_avatar_url' => $this->giver->avatar_url,
            'link' => "/profile/{$notifiable->username}",
        ];
    }
}
