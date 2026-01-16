<?php

namespace App\Events;

use App\Models\Guide;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GuidePublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Guide $guide;

    public function __construct(Guide $guide)
    {
        $this->guide = $guide->load('author');
    }

    public function broadcastOn(): Channel
    {
        return new Channel('guides');
    }

    public function broadcastAs(): string
    {
        return 'guide.published';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->guide->id,
            'title' => $this->guide->title,
            'slug' => $this->guide->slug,
            'excerpt' => $this->guide->excerpt,
            'featured_image_url' => $this->guide->featured_image_url,
            'difficulty' => $this->guide->difficulty,
            'author' => [
                'name' => $this->guide->author?->name,
                'avatar' => $this->guide->author?->avatar_url,
            ],
            'published_at' => $this->guide->published_at?->toIso8601String(),
        ];
    }
}
