<?php

namespace App\Notifications;

use App\Models\Article;
use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WishlistGameReviewedNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Game $game,
        protected Article $article,
        protected float $score
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'wishlist_reviewed',
            'title' => 'A wishlisted game was reviewed',
            'message' => "\"{$this->game->name}\" just got a review — score: {$this->score}/10",
            'game_slug' => $this->game->slug,
            'article_slug' => $this->article->slug,
            'score' => $this->score,
            'link' => "/reviews/{$this->article->slug}",
        ];
    }
}
