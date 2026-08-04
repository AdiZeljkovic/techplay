<?php

namespace App\Notifications;

use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GameReleaseNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Game $game) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'game_release',
            'title' => "{$this->game->name} is out",
            'message' => 'A game on your watchlist just released.',
            'url' => "/games/{$this->game->slug}",
            'image' => $this->game->background_image,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->game->name} is out today")
            ->greeting('It landed.')
            ->line("{$this->game->name} released today, and it was on your watchlist.")
            ->action('Open the game', config('app.frontend_url', 'https://techplay.gg')."/games/{$this->game->slug}")
            ->line('You get this because you asked to be reminded — turn it off from the release calendar any time.');
    }
}
