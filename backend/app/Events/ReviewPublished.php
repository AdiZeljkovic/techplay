<?php

namespace App\Events;

use App\Models\Review;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReviewPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Review $review;

    public function __construct(Review $review)
    {
        $this->review = $review;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('reviews');
    }

    public function broadcastAs(): string
    {
        return 'review.published';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->review->id,
            'title' => $this->review->title,
            'slug' => $this->review->slug,
            'item_name' => $this->review->item_name,
            'category' => $this->review->category,
            'summary' => $this->review->summary,
            'cover_image' => $this->review->cover_image,
            'rating' => $this->review->rating,
            'author' => [
                'name' => $this->review->author?->name,
                'avatar' => $this->review->author?->avatar_url,
            ],
            'published_at' => $this->review->published_at?->toIso8601String(),
        ];
    }
}
