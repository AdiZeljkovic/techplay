<?php

namespace App\Notifications;

use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WishlistGameReleasingSoonNotification extends Notification
{
    use Queueable;

    public function __construct(protected Game $game, protected int $daysLeft) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $label = $this->daysLeft === 1 ? 'tomorrow' : "in {$this->daysLeft} days";

        return [
            'type' => 'wishlist_releasing_soon',
            'title' => "{$this->game->name} releases {$label}!",
            'message' => "Mark your calendar — \"{$this->game->name}\" is dropping {$label}.",
            'game_slug' => $this->game->slug,
            'link' => "/calendar/{$this->game->slug}",
        ];
    }
}
