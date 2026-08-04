<?php

namespace App\Services;

use App\Events\ChatMessageSent;
use App\Models\Clan;
use App\Models\ClanMember;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * One chat system for direct messages, group chats and clan rooms. The shape
 * of a conversation is the only thing that differs; sending, reading, unread
 * counts and presentation are identical, which is why they live here once.
 */
class ChatService
{
    public function __construct(private SanitizationService $sanitizer) {}

    /* ── finding and making conversations ─────────────────────────────── */

    /**
     * The direct conversation between two people, created on first use.
     * Deliberately idempotent: opening a chat twice must not fork it.
     */
    public function directBetween(User $a, User $b): Conversation
    {
        $existing = Conversation::where('type', 'direct')
            ->whereHas('participants', fn ($q) => $q->where('user_id', $a->id))
            ->whereHas('participants', fn ($q) => $q->where('user_id', $b->id))
            ->withCount('participants')
            ->get()
            ->firstWhere('participants_count', 2);

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($a, $b) {
            $conversation = Conversation::create(['type' => 'direct']);

            foreach ([$a->id, $b->id] as $userId) {
                ConversationParticipant::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $userId,
                    'joined_at' => now(),
                ]);
            }

            return $conversation;
        });
    }

    /**
     * A group chat. Only friends can be added — a group is not a way to
     * message strangers who never accepted you.
     *
     * @param  int[]  $memberIds
     */
    public function createGroup(User $creator, string $name, array $memberIds): Conversation
    {
        $friendIds = $this->friendIds($creator);
        $invited = collect($memberIds)->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id !== $creator->id && $friendIds->contains($id))
            ->unique()
            ->values();

        if ($invited->isEmpty()) {
            throw new \RuntimeException('Add at least one friend to the group.');
        }

        return DB::transaction(function () use ($creator, $name, $invited) {
            $conversation = Conversation::create([
                'type' => 'group',
                'name' => $this->sanitizer->sanitizePlainText($name),
                'created_by' => $creator->id,
            ]);

            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $creator->id,
                'role' => 'owner',
                'joined_at' => now(),
                'last_read_at' => now(),
            ]);

            foreach ($invited as $userId) {
                ConversationParticipant::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $userId,
                    'joined_at' => now(),
                ]);
            }

            return $conversation;
        });
    }

    /**
     * A clan's room, created on first visit and kept in step with the roster
     * — joining the clan joins the room, leaving it leaves.
     */
    public function clanRoom(Clan $clan): Conversation
    {
        $conversation = Conversation::firstOrCreate(
            ['clan_id' => $clan->id],
            ['type' => 'clan', 'name' => $clan->name, 'image' => $clan->logo],
        );

        $memberIds = ClanMember::where('clan_id', $clan->id)->pluck('user_id');
        $present = $conversation->participants()->pluck('user_id');

        foreach ($memberIds->diff($present) as $userId) {
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $userId,
                'joined_at' => now(),
            ]);
        }

        // Someone who left the clan loses the room with it.
        ConversationParticipant::where('conversation_id', $conversation->id)
            ->whereNotIn('user_id', $memberIds)
            ->delete();

        return $conversation;
    }

    /* ── sending ──────────────────────────────────────────────────────── */

    public function send(Conversation $conversation, User $sender, ?string $body, ?array $attachment = null): Message
    {
        $clean = $body ? $this->sanitizer->sanitizePlainText($body) : null;

        if (($clean === null || $clean === '') && ! $attachment) {
            throw new \RuntimeException('A message needs something in it.');
        }

        $message = DB::transaction(function () use ($conversation, $sender, $clean, $attachment) {
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                // Kept in step for direct threads so the legacy inbox keeps working.
                'receiver_id' => $conversation->isDirect()
                    ? $conversation->participants()->where('user_id', '!=', $sender->id)->value('user_id')
                    : null,
                'body' => $clean ?? '',
                'attachment_path' => $attachment['path'] ?? null,
                'attachment_type' => $attachment['type'] ?? null,
            ]);

            $conversation->update(['last_message_at' => $message->created_at]);

            // The sender has by definition read their own message.
            ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', $sender->id)
                ->update(['last_read_at' => now()]);

            return $message;
        });

        $participantIds = $conversation->participants()->pluck('user_id')->all();

        try {
            broadcast(new ChatMessageSent(
                $conversation->id,
                $this->presentMessage($message->load('sender:id,username,avatar_url', 'reactions'), $sender->id),
                $participantIds,
            ))->toOthers();
        } catch (\Throwable) {
            // A silent websocket must never cost someone their message.
        }

        return $message;
    }

    public function markRead(Conversation $conversation, User $user): void
    {
        ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);
    }

    /** Toggle: the same emoji twice removes it. */
    public function react(Message $message, User $user, string $emoji): bool
    {
        $existing = $message->reactions()->where('user_id', $user->id)->where('emoji', $emoji)->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        $message->reactions()->create(['user_id' => $user->id, 'emoji' => $emoji]);

        return true;
    }

    /* ── reading ──────────────────────────────────────────────────────── */

    /**
     * Every conversation this user is in, newest first, with the last line,
     * the unread count and whoever they're talking to.
     */
    public function inbox(User $user): array
    {
        $participations = ConversationParticipant::where('user_id', $user->id)
            ->with('conversation')
            ->get()
            ->filter(fn ($p) => $p->conversation !== null);

        if ($participations->isEmpty()) {
            return [];
        }

        $conversationIds = $participations->pluck('conversation_id');

        $people = ConversationParticipant::whereIn('conversation_id', $conversationIds)
            ->with('user:id,username,avatar_url')
            ->get()
            ->groupBy('conversation_id');

        $lastMessages = Message::whereIn('conversation_id', $conversationIds)
            ->whereIn('id', function ($q) use ($conversationIds) {
                $q->selectRaw('MAX(id)')->from('messages')
                    ->whereIn('conversation_id', $conversationIds)
                    ->groupBy('conversation_id');
            })
            ->with('sender:id,username')
            ->get()
            ->keyBy('conversation_id');

        // Unread per conversation in one query: anything after last_read_at
        // that somebody else wrote.
        $unread = Message::whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $user->id)
            ->get(['conversation_id', 'created_at'])
            ->groupBy('conversation_id')
            ->map(function (Collection $rows, $conversationId) use ($participations) {
                $readAt = $participations->firstWhere('conversation_id', $conversationId)?->last_read_at;

                return $readAt
                    ? $rows->filter(fn ($m) => $m->created_at->gt($readAt))->count()
                    : $rows->count();
            });

        return $participations
            ->map(function (ConversationParticipant $participation) use ($people, $lastMessages, $unread, $user) {
                $conversation = $participation->conversation;
                $members = $people[$conversation->id] ?? collect();
                $last = $lastMessages[$conversation->id] ?? null;

                return [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'name' => $this->titleFor($conversation, $members, $user),
                    'image' => $this->imageFor($conversation, $members, $user),
                    'partner' => $conversation->isDirect()
                        ? $this->presentUser($members->firstWhere('user_id', '!=', $user->id)?->user)
                        : null,
                    'members_count' => $members->count(),
                    'last_message' => $last ? [
                        'body' => $last->attachment_path && ! $last->body ? 'Sent an image' : $last->body,
                        'sender' => $last->sender?->username,
                        'is_mine' => $last->sender_id === $user->id,
                        'created_at' => $last->created_at->toIso8601String(),
                    ] : null,
                    'unread' => (int) ($unread[$conversation->id] ?? 0),
                    'muted' => (bool) $participation->muted,
                    'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                ];
            })
            ->sortByDesc(fn (array $row) => $row['last_message_at'] ?? '')
            ->values()
            ->all();
    }

    public function thread(Conversation $conversation, User $user, int $limit = 50): array
    {
        $messages = $conversation->messages()
            ->with(['sender:id,username,avatar_url', 'reactions'])
            ->latest('id')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return $messages->map(fn (Message $m) => $this->presentMessage($m, $user->id))->all();
    }

    public function presentMessage(Message $message, int $viewerId): array
    {
        $reactions = $message->reactions->groupBy('emoji')->map(fn (Collection $rows, string $emoji) => [
            'emoji' => $emoji,
            'count' => $rows->count(),
            'mine' => $rows->contains('user_id', $viewerId),
        ])->values()->all();

        return [
            'id' => $message->id,
            'body' => $message->body,
            'attachment_path' => $message->attachment_path,
            'attachment_type' => $message->attachment_type,
            'created_at' => $message->created_at->toIso8601String(),
            'is_mine' => $message->sender_id === $viewerId,
            'sender' => $this->presentUser($message->sender),
            'reactions' => $reactions,
        ];
    }

    /** Total unread across every conversation — the header badge. */
    public function unreadTotal(User $user): int
    {
        return collect($this->inbox($user))->sum('unread');
    }

    /* ── helpers ──────────────────────────────────────────────────────── */

    private function titleFor(Conversation $conversation, Collection $members, User $viewer): string
    {
        if ($conversation->isDirect()) {
            $other = $members->firstWhere('user_id', '!=', $viewer->id);

            return $other?->user?->username ?? 'Conversation';
        }

        return $conversation->name ?? 'Group';
    }

    private function imageFor(Conversation $conversation, Collection $members, User $viewer): ?string
    {
        if ($conversation->isDirect()) {
            return $members->firstWhere('user_id', '!=', $viewer->id)?->user?->avatar_url;
        }

        return $conversation->image;
    }

    private function presentUser(?User $user): ?array
    {
        return $user ? [
            'id' => $user->id,
            'username' => $user->username,
            'avatar_url' => $user->avatar_url,
        ] : null;
    }

    /** @return Collection<int,int> */
    public function friendIds(User $user): Collection
    {
        return Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->get(['sender_id', 'receiver_id'])
            ->map(fn ($f) => $f->sender_id === $user->id ? $f->receiver_id : $f->sender_id)
            ->unique()
            ->values();
    }
}
