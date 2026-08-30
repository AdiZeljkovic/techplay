<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\User;
use App\Notifications\FriendRequestNotification;
use App\Services\AchievementService;
use App\Services\QuestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
    // List all friends - return only safe fields
    public function index()
    {
        $userId = Auth::id();

        $friends = Friendship::where(function ($query) use ($userId) {
            $query->where('sender_id', $userId)
                ->orWhere('receiver_id', $userId);
        })
            ->where('status', 'accepted')
            ->with(['sender:id,username,display_name,avatar_url', 'receiver:id,username,display_name,avatar_url'])
            ->get()
            ->map(function ($friendship) use ($userId) {
                $friend = $friendship->sender_id === $userId ? $friendship->receiver : $friendship->sender;

                return [
                    'id' => $friend->id,
                    'username' => $friend->username,
                    'display_name' => $friend->display_name,
                    'avatar_url' => $friend->avatar_url,
                ];
            });

        return response()->json($friends);
    }

    // Send a friend request
    public function sendRequest(Request $request)
    {
        $request->validate(['username' => 'required|exists:users,username']);

        $receiver = User::byUsername($request->username)->firstOrFail();
        $senderId = Auth::id();

        if ($receiver->id === $senderId) {
            return response()->json(['message' => 'Cannot add yourself'], 400);
        }

        // Check exists
        $exists = Friendship::where(function ($q) use ($senderId, $receiver) {
            $q->where('sender_id', $senderId)->where('receiver_id', $receiver->id);
        })->orWhere(function ($q) use ($senderId, $receiver) {
            $q->where('sender_id', $receiver->id)->where('receiver_id', $senderId);
        })->first();

        if ($exists) {
            return response()->json(['message' => 'Request already sent or accepted'], 400);
        }

        Friendship::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiver->id,
            'status' => 'pending',
        ]);

        try {
            $receiver->notify(new FriendRequestNotification(Auth::user(), 'sent'));
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Friend request sent']);
    }

    // Accept request
    public function acceptRequest($senderId)
    {
        $friendship = Friendship::where('sender_id', $senderId)
            ->where('receiver_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        $friendship->update(['status' => 'accepted']);

        try {
            $friendship->load('sender');
            $friendship->sender->notify(new FriendRequestNotification(Auth::user(), 'accepted'));
        } catch (\Throwable) {
        }

        // Both sides just gained a friend, and three achievements are counted
        // off exactly this. Nothing checked them here, so Friendly, Socialite
        // and Popular could only ever be granted by running a console command
        // by hand.
        try {
            app(AchievementService::class)->check(Auth::user(), ['friends_count']);
            app(AchievementService::class)->check($friendship->sender, ['friends_count']);
            app(QuestService::class)->progress(Auth::user(), 'friend_made');
            app(QuestService::class)->progress($friendship->sender, 'friend_made');
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Friend request accepted']);
    }

    // Block user
    public function block($userId)
    {
        $currentUserId = Auth::id();
        $userId = (int) $userId;

        // The id arrived raw — no existence check, no self-check — so junk
        // rows and self-blocks were writable, and on some schemas it threw a
        // bare foreign-key error.
        if ($userId === (int) $currentUserId || ! User::whereKey($userId)->exists()) {
            return response()->json(['message' => 'That user cannot be blocked.'], 422);
        }

        // A block is its own directional record.
        //
        // This used to find whatever row existed between the two people — in
        // either direction — and rewrite it with the blocker as sender. So if
        // they had already blocked you, blocking them back **overwrote their
        // block with yours**, and they silently lost their protection. The row
        // is now only ever written on the (me → them) pair.
        DB::transaction(function () use ($currentUserId, $userId) {
            // Blocking ends the relationship: friendIds() reads accepted rows
            // in both directions, so leaving one behind would keep you listed
            // as friends. Their block of you, if any, is left untouched.
            Friendship::whereIn('status', ['accepted', 'pending'])
                ->where(function ($q) use ($currentUserId, $userId) {
                    $q->where(fn ($i) => $i->where('sender_id', $currentUserId)->where('receiver_id', $userId))
                        ->orWhere(fn ($i) => $i->where('sender_id', $userId)->where('receiver_id', $currentUserId));
                })
                ->delete();

            Friendship::updateOrCreate(
                ['sender_id' => $currentUserId, 'receiver_id' => $userId],
                ['status' => 'blocked'],
            );
        });

        return response()->json(['message' => 'User blocked']);
    }

    /**
     * Lift a block.
     *
     * There was no way to do this at all: block() existed, the social hub
     * listed who you had blocked, and nothing could undo it. Wiring a block
     * button without this would have been building a door with no handle on
     * the inside.
     */
    public function unblock($userId)
    {
        $currentUserId = Auth::id();
        $userId = (int) $userId;

        $removed = Friendship::where('status', 'blocked')
            ->where('sender_id', $currentUserId)
            ->where('receiver_id', $userId)
            ->delete();

        if ($removed === 0) {
            return response()->json(['message' => 'You have not blocked that user.'], 404);
        }

        // Deleting the row rather than restoring a friendship: a block ends the
        // relationship, and whoever wants it back can send a fresh request.
        return response()->json(['message' => 'User unblocked']);
    }

    // Decline request
    public function declineRequest($senderId)
    {
        $friendship = Friendship::where('sender_id', $senderId)
            ->where('receiver_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        $friendship->delete();

        return response()->json(['message' => 'Friend request declined']);
    }
}
