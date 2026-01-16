<?php

namespace App\Events;

use App\Models\Video;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VideoPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Video $video;

    public function __construct(Video $video)
    {
        $this->video = $video;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('videos');
    }

    public function broadcastAs(): string
    {
        return 'video.published';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->video->id,
            'title' => $this->video->title,
            'slug' => $this->video->slug,
            'youtube_url' => $this->video->youtube_url,
            'thumbnail_url' => $this->video->thumbnail_url,
            'youtube_id' => $this->video->youtube_id,
            'published_at' => $this->video->published_at?->toIso8601String(),
        ];
    }
}
