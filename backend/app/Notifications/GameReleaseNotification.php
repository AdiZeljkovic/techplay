<?php

namespace App\Notifications;

use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GameReleaseNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Game $game) {}

    /**
     * The bell, not the inbox.
     *
     * Decided 31.08.2026: TechPlay sends exactly four kinds of email — address
     * verification, password reset, the contact form, and the newsletter
     * confirmation. Everything else a member might want to know reaches them
     * in the app.
     *
     * The reason is deliverability, and it is not abstract. A domain earns its
     * way into the inbox slowly and loses it fast; a handful of "mark as spam"
     * clicks on a weekly digest costs the reputation that the verification and
     * password-reset mail depends on. Those two have to arrive, so nothing
     * optional is allowed to put them at risk.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            // `link` and `icon_path`, because those are the two keys
            // NotificationController::present reads. Written as `url` and
            // `image`, this notification reached the bell with nowhere to click
            // and no artwork beside it.
            'type' => 'game_release',
            'title' => "{$this->game->name} is out",
            'message' => 'A game on your watchlist just released.',
            'link' => "/games/{$this->game->slug}",
            'icon_path' => $this->game->cover_url,
        ];
    }
}
