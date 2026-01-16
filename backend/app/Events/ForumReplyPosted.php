<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ForumReplyPosted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Post $post;

    public function __construct(Post $post)
    {
        $this->post = $post->load('author');
    }

    /**
     * Broadcast to thread-specific channel.
     */
    public function broadcastOn(): Channel
    {
        return new Channel("forum.thread.{$this->post->thread_id}");
    }

    public function broadcastAs(): string
    {
        return 'reply.posted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->post->id,
            'thread_id' => $this->post->thread_id,
            'content' => $this->post->content,
            'author' => [
                'id' => $this->post->author?->id,
                'name' => $this->post->author?->name,
                'username' => $this->post->author?->username,
                'avatar' => $this->post->author?->avatar_url,
            ],
            'created_at' => $this->post->created_at->toIso8601String(),
        ];
    }
}
