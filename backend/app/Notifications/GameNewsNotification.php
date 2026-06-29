<?php

namespace App\Notifications;

use App\Models\Article;
use App\Models\Game;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GameNewsNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Game $game,
        protected Article $article,
        protected string $categoryPath
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'         => 'game_news',
            'title'        => "New article about {$this->game->name}",
            'message'      => $this->article->title,
            'game_slug'    => $this->game->slug,
            'article_slug' => $this->article->slug,
            'link'         => "/{$this->categoryPath}/{$this->article->slug}",
        ];
    }
}
