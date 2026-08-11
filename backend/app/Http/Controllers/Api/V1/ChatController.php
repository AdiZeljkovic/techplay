<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use App\Services\ChatService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

/**
 * The Social Hub: conversations of every kind, plus the rails that surround
 * them. One controller because the page loads as one thing.
 */
class ChatController extends Controller
{
    use ApiResponse;

    /** The reaction set — a closed list keeps the row from becoming a wall. */
    private const EMOJI = ['👍', '🔥', '😂', '❤️', '😮', '😢'];

    /**
     * GET /social — everything the hub's shell needs in one call.
     */
    public function hub(Request $request, ChatService $chat): JsonResponse
    {
        $user = $request->user();

        $friendIds = $chat->friendIds($user);
        $onlineIds = $this->onlineIds();

        $friends = User::whereIn('id', $friendIds)
            ->get(['id', 'username', 'display_name', 'avatar_url', 'xp'])
            ->keyBy('id');

        $playing = DB::table('presences')
            ->whereIn('user_id', $friendIds)
            ->where('is_active', true)
            ->pluck('game_name', 'user_id');

        $roster = $friendIds->map(function (int $id) use ($friends, $onlineIds, $playing) {
            $friend = $friends[$id] ?? null;

            if (! $friend) {
                return null;
            }

            return [
                'id' => $friend->id,
                'username' => $friend->username,
                'display_name' => $friend->display_name,
                'avatar_url' => $friend->avatar_url,
                'online' => in_array($id, $onlineIds, true),
                'game' => $playing[$id] ?? null,
            ];
        })->filter()->values();

        $inbox = $chat->inbox($user);

        return $this->success([
            'stats' => [
                'friends' => $roster->count(),
                'online' => $roster->where('online', true)->count(),
                'conversations' => count($inbox),
                'unread' => collect($inbox)->sum('unread'),
                'groups' => collect($inbox)->where('type', 'group')->count(),
            ],
            'friends' => $roster->sortByDesc(fn ($f) => ($f['game'] ? 2 : 0) + ($f['online'] ? 1 : 0))->values()->all(),
            'requests' => $this->pendingRequests($user),
            'blocked' => $this->blockedUsers($user),
            'suggestions' => $this->peopleYouMayKnow($user, $friendIds),
        ]);
    }

    /* ── conversations ────────────────────────────────────────────────── */

    /** GET /conversations */
    public function index(Request $request, ChatService $chat): JsonResponse
    {
        return $this->success($chat->inbox($request->user()));
    }

    /**
     * POST /conversations — open a direct thread, or start a group.
     * { type: direct, username } | { type: group, name, member_ids[] }
     */
    public function store(Request $request, ChatService $chat): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:direct,group',
            'username' => 'required_if:type,direct|string|exists:users,username',
            'name' => 'required_if:type,group|string|max:80',
            'member_ids' => 'required_if:type,group|array|min:1|max:24',
            'member_ids.*' => 'integer',
        ]);

        $user = $request->user();

        try {
            if ($data['type'] === 'direct') {
                $other = User::where('username', $data['username'])->firstOrFail();

                if ($other->id === $user->id) {
                    return $this->error('You cannot message yourself.', 422);
                }

                $conversation = $chat->directBetween($user, $other);
            } else {
                $conversation = $chat->createGroup($user, $data['name'], $data['member_ids']);
            }
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(['id' => $conversation->id, 'type' => $conversation->type], 'Conversation ready.');
    }

    /** GET /conversations/{conversation}/messages */
    public function messages(Request $request, Conversation $conversation, ChatService $chat): JsonResponse
    {
        if (! $conversation->hasParticipant($request->user()->id)) {
            return $this->error('This conversation is not yours.', 403);
        }

        $chat->markRead($conversation, $request->user());

        return $this->success([
            'messages' => $chat->thread($conversation, $request->user()),
            'members' => $conversation->participants()->with('user:id,username,avatar_url')->get()
                ->map(fn (ConversationParticipant $p) => [
                    'id' => $p->user?->id,
                    'username' => $p->user?->username,
                    'avatar_url' => $p->user?->avatar_url,
                    'role' => $p->role,
                    'online' => in_array($p->user_id, $this->onlineIds(), true),
                ])->filter(fn ($m) => $m['id'])->values(),
            'emoji' => self::EMOJI,
        ]);
    }

    /** POST /conversations/{conversation}/messages */
    public function send(Request $request, Conversation $conversation, ChatService $chat): JsonResponse
    {
        $user = $request->user();

        if (! $conversation->hasParticipant($user->id)) {
            return $this->error('This conversation is not yours.', 403);
        }

        // Blocking someone did not delete the existing thread, so refusing new
        // conversations alone left every prior DM fully usable.
        if ($conversation->type === 'direct') {
            $otherId = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $user->id)
                ->value('user_id');

            if ($otherId && Friendship::blockExistsBetween($user->id, (int) $otherId)) {
                return $this->error('You cannot message this user.', 403);
            }
        }

        $request->validate([
            'body' => 'nullable|string|max:2000',
            'image' => 'nullable|image|max:4096',
        ]);

        $attachment = null;

        if ($request->hasFile('image')) {
            // Private disk. On the public one these sat at a plain
            // /storage/chat/<hash>.jpg URL with no authorization at all — the
            // unguessable filename was the only control, so the image outlived
            // leaving the group, blocking, and deleting the conversation.
            $attachment = [
                'path' => $request->file('image')->store('chat', 'local'),
                'type' => 'image',
            ];
        }

        try {
            $message = $chat->send($conversation, $user, $request->input('body'), $attachment);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(
            $chat->presentMessage($message->load('sender:id,username,avatar_url', 'reactions'), $user->id),
            'Sent.'
        );
    }

    /** POST /conversations/{conversation}/read */
    public function markRead(Request $request, Conversation $conversation, ChatService $chat): JsonResponse
    {
        if (! $conversation->hasParticipant($request->user()->id)) {
            return $this->error('This conversation is not yours.', 403);
        }

        $chat->markRead($conversation, $request->user());

        return $this->success(null);
    }

    /** POST /conversations/{conversation}/participants { member_ids[] } */
    public function addParticipants(Request $request, Conversation $conversation, ChatService $chat): JsonResponse
    {
        $user = $request->user();
        $me = $conversation->participants()->where('user_id', $user->id)->first();

        if (! $me || $conversation->type !== 'group') {
            return $this->error('Only group members can add people.', 403);
        }

        // The `role` column was written but never read, so any member could
        // add their own alt account to a group and hand it the full history.
        if (! in_array($me->role, ['owner', 'admin'], true)) {
            return $this->error('Only the group owner can add people.', 403);
        }

        $data = $request->validate(['member_ids' => 'required|array|max:24', 'member_ids.*' => 'integer']);
        $friendIds = $chat->friendIds($user);

        $added = 0;
        foreach ($data['member_ids'] as $id) {
            if (! $friendIds->contains((int) $id) || $conversation->hasParticipant((int) $id)) {
                continue;
            }

            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => (int) $id,
                'joined_at' => now(),
            ]);
            $added++;
        }

        return $this->success(['added' => $added], $added === 1 ? '1 member added.' : "{$added} members added.");
    }

    /**
     * GET /chat/attachments/{message} — signed; serves a DM image.
     *
     * The signature is the authorization: it is minted per render, expires,
     * and only ever handed to participants. An <img> tag cannot carry a bearer
     * token, so a signed URL is what replaces the world-readable path.
     */
    public function attachment(Message $message)
    {
        if (! $message->attachment_path) {
            abort(404);
        }

        // Older attachments were written to the public disk before this moved.
        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($message->attachment_path)) {
                return Storage::disk($disk)->response($message->attachment_path);
            }
        }

        abort(404);
    }

    /** DELETE /conversations/{conversation}/leave */
    public function leave(Request $request, Conversation $conversation): JsonResponse
    {
        // Checked before the type branches: the three distinct refusals below
        // let an authenticated caller walk conversation ids and learn which
        // exist and which pairs have a DM open.
        if (! $conversation->hasParticipant($request->user()->id)) {
            return $this->error('This conversation is not yours.', 403);
        }

        if ($conversation->type === 'direct') {
            return $this->error('Direct threads cannot be left — delete the conversation instead.', 422);
        }

        ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return $this->success(null, 'You left the group.');
    }

    /** POST /messages/{message}/react { emoji } */
    public function react(Request $request, Message $message, ChatService $chat): JsonResponse
    {
        $conversation = $message->conversation;

        if (! $conversation || ! $conversation->hasParticipant($request->user()->id)) {
            return $this->error('This conversation is not yours.', 403);
        }

        $data = $request->validate(['emoji' => 'required|string|max:8']);

        if (! in_array($data['emoji'], self::EMOJI, true)) {
            return $this->error('That reaction is not available.', 422);
        }

        $chat->react($message, $request->user(), $data['emoji']);

        return $this->success(
            $chat->presentMessage($message->fresh()->load('sender:id,username,avatar_url', 'reactions'), $request->user()->id)
        );
    }

    /* ── the rails ────────────────────────────────────────────────────── */

    /** @return int[] */
    private function onlineIds(): array
    {
        try {
            return array_map('intval', Redis::zrangebyscore(
                'forum:users:online', now()->subMinutes(5)->timestamp, '+inf'
            ) ?: []);
        } catch (\Throwable) {
            return [];
        }
    }

    private function pendingRequests(User $user): array
    {
        return Friendship::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with('sender:id,username,display_name,avatar_url,xp')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Friendship $f) => [
                // The accept/decline routes are keyed by the *sender*, which is
                // what FriendController::pendingRequests has always returned.
                // Handing back the friendship row id instead meant every
                // Accept from the Social Hub 404'd.
                'id' => $f->sender_id,
                'friendship_id' => $f->id,
                'created_at' => $f->created_at->toIso8601String(),
                'user' => $f->sender ? [
                    'id' => $f->sender->id,
                    'username' => $f->sender->username,
                    'display_name' => $f->sender->display_name,
                    'avatar_url' => $f->sender->avatar_url,
                    'xp' => (int) $f->sender->xp,
                ] : null,
            ])
            ->filter(fn ($row) => $row['user'])
            ->values()
            ->all();
    }

    private function blockedUsers(User $user): array
    {
        return Friendship::where('status', 'blocked')
            ->where('sender_id', $user->id)
            ->with('receiver:id,username,avatar_url')
            ->get()
            ->map(fn (Friendship $f) => $f->receiver ? [
                'id' => $f->receiver->id,
                'username' => $f->receiver->username,
                'avatar_url' => $f->receiver->avatar_url,
            ] : null)
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Friends of friends, ranked by how many you share — the only honest
     * definition of "may know" we can compute.
     */
    private function peopleYouMayKnow(User $user, Collection $friendIds): array
    {
        if ($friendIds->isEmpty()) {
            return [];
        }

        $secondDegree = Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->whereIn('sender_id', $friendIds)->orWhereIn('receiver_id', $friendIds))
            ->get(['sender_id', 'receiver_id'])
            ->flatMap(fn ($f) => [
                ['id' => $f->sender_id, 'via' => $f->receiver_id],
                ['id' => $f->receiver_id, 'via' => $f->sender_id],
            ])
            ->filter(fn ($row) => $row['id'] !== $user->id && ! $friendIds->contains($row['id']) && $friendIds->contains($row['via']))
            ->groupBy('id')
            ->map(fn ($rows) => $rows->pluck('via')->unique()->count())
            ->sortDesc()
            ->take(5);

        if ($secondDegree->isEmpty()) {
            return [];
        }

        // Anyone already asking, or already asked, is not a suggestion.
        $pending = Friendship::where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->whereIn('status', ['pending', 'blocked'])
            ->get(['sender_id', 'receiver_id'])
            ->flatMap(fn ($f) => [$f->sender_id, $f->receiver_id])
            ->unique();

        $users = User::whereIn('id', $secondDegree->keys())
            ->whereNotIn('id', $pending)
            ->get(['id', 'username', 'display_name', 'avatar_url'])
            ->keyBy('id');

        return $secondDegree
            ->filter(fn ($count, $id) => $users->has($id))
            ->map(fn (int $mutual, $id) => [
                'id' => (int) $id,
                'username' => $users[$id]->username,
                'display_name' => $users[$id]->display_name,
                'avatar_url' => $users[$id]->avatar_url,
                'mutual_friends' => $mutual,
            ])
            ->values()
            ->all();
    }
}
