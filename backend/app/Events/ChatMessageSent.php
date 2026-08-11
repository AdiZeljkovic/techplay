<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A message landed in a conversation. Broadcast on the conversation's own
 * channel — everyone watching that thread gets it without polling, which is
 * the difference between a message list and a chat.
 *
 * The channels are private and authorised in routes/channels.php against
 * conversation membership. They were public once, which meant the body of
 * every direct message on the site was readable by anyone holding the
 * publishable Reverb key — which ships in the browser bundle.
 */
class ChatMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string,mixed>  $message  the already-presented row, so the
     *                                        client renders it exactly as the
     *                                        REST payload would.
     * @param  int[]  $participantIds  used for the per-user inbox nudge
     */
    public function __construct(
        public readonly int $conversationId,
        public readonly array $message,
        public readonly array $participantIds = [],
    ) {}

    /** @return PrivateChannel[] */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel("conversation.{$this->conversationId}")];

        // Each participant also has a personal channel, so an unread badge
        // updates on a page that isn't showing the thread at all.
        foreach ($this->participantIds as $userId) {
            $channels[] = new PrivateChannel("user.{$userId}.chat");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'chat.message';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message' => $this->message,
        ];
    }
}
