<?php

namespace App\Events;

use App\Events\Concerns\BroadcastsOnTheLiveQueue;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PresenceUpdated implements ShouldBroadcast
{
    use BroadcastsOnTheLiveQueue, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly ?string $gameName,
        public readonly ?string $gameSlug,
        public readonly ?string $source,
        public readonly ?string $startedAt,
    ) {}

    public function broadcastOn(): Channel
    {
        // Public channel — profile visitors don't need auth to watch someone's presence.
        return new Channel("presence.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'presence.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'game_name' => $this->gameName,
            'game_slug' => $this->gameSlug,
            'source' => $this->source,
            'started_at' => $this->startedAt,
            'is_active' => $this->gameName !== null,
        ];
    }
}
