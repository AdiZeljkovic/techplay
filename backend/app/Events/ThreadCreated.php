<?php

namespace App\Events;

use App\Models\Thread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThreadCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Thread $thread;

    public function __construct(Thread $thread)
    {
        $this->thread = $thread->load(['author', 'category']);
    }

    public function broadcastOn(): Channel
    {
        return new Channel('forum');
    }

    public function broadcastAs(): string
    {
        return 'thread.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->thread->id,
            'title' => $this->thread->title,
            'slug' => $this->thread->slug,
            'content' => substr($this->thread->content, 0, 200) . '...',
            'category' => [
                'id' => $this->thread->category?->id,
                'name' => $this->thread->category?->name,
                'slug' => $this->thread->category?->slug,
            ],
            'author' => [
                'id' => $this->thread->author?->id,
                'name' => $this->thread->author?->name,
                'username' => $this->thread->author?->username,
                'avatar' => $this->thread->author?->avatar_url,
            ],
            'created_at' => $this->thread->created_at->toIso8601String(),
        ];
    }
}
