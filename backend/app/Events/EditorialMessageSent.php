<?php

namespace App\Events;

use App\Models\EditorialMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EditorialMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(EditorialMessage $message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->message->channel) {
            return [
                new PrivateChannel('editorial.channel.' . $this->message->channel),
            ];
        }

        if ($this->message->recipient_id) {
            // Broadcast to both sender and recipient so both see it immediately if they have the window open
            // Though usually sender sees it via optimistic UI, but for consistency:
            // We can broadcast to a dedicated user channel or a specific conversation channel.
            // Let's use user-specific channels for simplicity: user.{id}
            return [
                new PrivateChannel('editorial.user.' . $this->message->recipient_id),
                new PrivateChannel('editorial.user.' . $this->message->user_id),
            ];
        }

        return [];
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'content' => $this->message->content, // Will be formatted by frontend
            'user_id' => $this->message->user_id,
            'user_name' => $this->message->user->name,
            'user_avatar_color' => '#FC4100', // Simplify or fetch from helper logic if moved to model
            'created_at' => $this->message->created_at->toIso8601String(),
            'channel' => $this->message->channel,
            'recipient_id' => $this->message->recipient_id,
            'attachment_url' => $this->message->attachment_url,
            'parent_id' => $this->message->parent_id,
            'role_badge' => ['color' => '#6b7280', 'short' => '?'], // Placeholder, ideally fetch authentic badge data
        ];
    }
}
