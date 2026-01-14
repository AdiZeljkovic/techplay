<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EditorialMessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;     // Who read the messages
    public $senderId;   // Whose messages were read (the recipient of this event)
    public $readAt;

    public function __construct($userId, $senderId)
    {
        $this->userId = $userId;
        $this->senderId = $senderId;
        $this->readAt = now();
    }

    public function broadcastOn(): array
    {
        // Broadcast to the SENDER of the messages, so they know I read them.
        return [
            new PrivateChannel('editorial.user.' . $this->senderId),
        ];
    }

    public function broadcastAs()
    {
        return 'messages.read';
    }
}
