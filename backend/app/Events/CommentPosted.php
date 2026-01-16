<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentPosted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Comment $comment;

    public function __construct(Comment $comment)
    {
        $this->comment = $comment->load('user');
    }

    /**
     * Broadcast on a public channel based on the commentable type and ID.
     * e.g., "comments.articles.123"
     */
    public function broadcastOn(): Channel
    {
        $type = class_basename($this->comment->commentable_type);
        $type = strtolower($type) . 's'; // articles, reviews, videos, etc.

        return new Channel("comments.{$type}.{$this->comment->commentable_id}");
    }

    public function broadcastAs(): string
    {
        return 'comment.posted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->comment->id,
            'content' => $this->comment->content,
            'parent_id' => $this->comment->parent_id,
            'created_at' => $this->comment->created_at->toIso8601String(),
            'user' => [
                'id' => $this->comment->user->id,
                'name' => $this->comment->user->name,
                'username' => $this->comment->user->username,
                'avatar_url' => $this->comment->user->avatar_url,
            ],
        ];
    }
}
