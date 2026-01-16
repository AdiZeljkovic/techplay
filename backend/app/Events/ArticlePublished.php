<?php

namespace App\Events;

use App\Models\Article;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ArticlePublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Article $article;

    public function __construct(Article $article)
    {
        $this->article = $article;
    }

    /**
     * Broadcast on a public channel so everyone sees new articles.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('news');
    }

    public function broadcastAs(): string
    {
        return 'article.published';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->article->id,
            'title' => $this->article->title,
            'slug' => $this->article->slug,
            'excerpt' => $this->article->excerpt,
            'featured_image_url' => $this->article->featured_image_url,
            'category' => $this->article->category?->name,
            'category_slug' => $this->article->category?->slug,
            'author' => [
                'name' => $this->article->author?->name,
                'avatar' => $this->article->author?->avatar_url,
            ],
            'published_at' => $this->article->published_at?->toIso8601String(),
        ];
    }
}
