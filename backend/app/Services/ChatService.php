<?php

namespace App\Services;

use App\Events\ChatMessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

/**
 * One chat system for direct messages and group chats. The shape
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
        if (Friendship::blockExistsBetween($a->id, $b->id)) {
            throw new \RuntimeException('You cannot message this user.');
        }

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

        // Unread per conversation, counted by the database.
        //
        // This used to select every message the viewer had not written across
        // every conversation they belong to, hydrate the lot, and count them in
        // PHP — so opening the hub loaded a person's entire message history to
        // put a number on a badge.
        $unread = DB::table('messages as m')
            ->join('conversation_participants as p', function ($join) use ($user) {
                $join->on('p.conversation_id', '=', 'm.conversation_id')
                    ->where('p.user_id', '=', $user->id);
            })
            ->whereIn('m.conversation_id', $conversationIds)
            ->where('m.sender_id', '!=', $user->id)
            ->where(fn ($q) => $q->whereNull('p.last_read_at')->orWhereColumn('m.created_at', '>', 'p.last_read_at'))
            ->groupBy('m.conversation_id')
            ->selectRaw('m.conversation_id, COUNT(*) as tally')
            ->pluck('tally', 'm.conversation_id');

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

    /**
     * The last `limit` messages, or the ones before `beforeId`.
     *
     * There was no second argument and no way to ask for anything older, so a
     * conversation was fifty messages long however much had been said in it —
     * everything before that was in the database and out of reach.
     *
     * @return array{messages:array,has_more:bool}
     */
    public function thread(Conversation $conversation, User $user, int $limit = 50, ?int $beforeId = null): array
    {
        $rows = $conversation->messages()
            ->with(['sender:id,username,avatar_url', 'reactions'])
            ->when($beforeId, fn ($q) => $q->where('id', '<', $beforeId))
            ->latest('id')
            ->limit($limit + 1)
            ->get();

        // One more was asked for than will be sent: if it arrived, there is
        // older still to come.
        $hasMore = $rows->count() > $limit;

        return [
            'messages' => $rows->take($limit)->reverse()->values()
                ->map(fn (Message $m) => $this->presentMessage($m, $user->id))->all(),
            'has_more' => $hasMore,
        ];
    }

    /**
     * Unsend: the row goes, and the conversation's own clock is wound back to
     * whatever is now last so the inbox preview does not quote a message that
     * no longer exists.
     */
    public function deleteMessage(Message $message): void
    {
        $conversation = $message->conversation;

        $message->delete();

        if (! $conversation) {
            return;
        }

        $last = $conversation->messages()->latest('id')->first();

        $conversation->last_message_at = $last?->created_at;
        $conversation->save();
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
            // A short-lived signed URL rather than a storage path: the image
            // now lives on a private disk, and the signature is what lets an
            // <img> tag fetch it without a bearer token.
            'attachment_url' => $message->attachment_path
                ? URL::temporarySignedRoute('chat.attachment', now()->addHours(6), ['message' => $message->id])
                : null,
            'attachment_type' => $message->attachment_type,
            'created_at' => $message->created_at->toIso8601String(),
            'is_mine' => $message->sender_id === $viewerId,
            'sender' => $this->presentUser($message->sender),
            'reactions' => $reactions,
        ];
    }

    /** Total unread across every conversation — the header badge. */
    /**
     * How many messages are waiting, in one query.
     *
     * Unread lives in conversation_participants.last_read_at — the same
     * definition the hub's badges use — not in messages.is_read, which the
     * chat has never written.
     */
    public function unreadCount(User $user): int
    {
        return (int) DB::table('messages as m')
            ->join('conversation_participants as p', function ($join) use ($user) {
                $join->on('p.conversation_id', '=', 'm.conversation_id')
                    ->where('p.user_id', '=', $user->id);
            })
            ->where('m.sender_id', '!=', $user->id)
            ->where(fn ($q) => $q->whereNull('p.last_read_at')->orWhereColumn('m.created_at', '>', 'p.last_read_at'))
            ->count();
    }

    public function unreadTotal(User $user): int
    {
        return $this->unreadCount($user);
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
