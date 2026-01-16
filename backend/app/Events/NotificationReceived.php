<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public User $user;
    public string $type;
    public string $message;
    public ?string $link;
    public ?array $data;

    public function __construct(User $user, string $type, string $message, ?string $link = null, ?array $data = null)
    {
        $this->user = $user;
        $this->type = $type;
        $this->message = $message;
        $this->link = $link;
        $this->data = $data;
    }

    /**
     * Broadcast on user's private channel.
     */
    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("user.{$this->user->id}");
    }

    public function broadcastAs(): string
    {
        return 'notification.received';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'message' => $this->message,
            'link' => $this->link,
            'data' => $this->data,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
