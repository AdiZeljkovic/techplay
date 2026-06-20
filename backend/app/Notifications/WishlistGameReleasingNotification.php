<?php

namespace App\Notifications;

use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WishlistGameReleasingNotification extends Notification
{
    use Queueable;

    public function __construct(protected Game $game) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'wishlist_releasing',
            'title' => 'A wishlisted game is out today!',
            'message' => "\"{$this->game->name}\" releases today!",
            'game_slug' => $this->game->slug,
            'link' => "/games/{$this->game->slug}",
        ];
    }
}
