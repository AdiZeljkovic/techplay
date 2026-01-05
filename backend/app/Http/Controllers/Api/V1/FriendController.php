<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FriendController extends Controller
{
    // List all friends
    public function index()
    {
        $userId = Auth::id();

        $friends = Friendship::where(function ($query) use ($userId) {
            $query->where('sender_id', $userId)
                ->orWhere('receiver_id', $userId);
        })
            ->where('status', 'accepted')
            ->with(['sender', 'receiver'])
            ->get()
            ->map(function ($friendship) use ($userId) {
                return $friendship->sender_id === $userId ? $friendship->receiver : $friendship->sender;
            });

        return response()->json($friends);
    }

    // List pending requests (received)
    public function penndingRequests()
    {
        $requests = Friendship::where('receiver_id', Auth::id())
            ->where('status', 'pending')
            ->with('sender')
            ->get()
            ->pluck('sender');

        return response()->json($requests);
    }

    // Send a friend request
    public function sendRequest(Request $request)
    {
        $request->validate(['username' => 'required|exists:users,username']);

        $receiver = User::where('username', $request->username)->firstOrFail();
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
            'status' => 'pending'
        ]);

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

        return response()->json(['message' => 'Friend request accepted']);
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

    // Search users for adding friends
    public function search(Request $request)
    {
        $query = $request->input('query');
        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        $userId = Auth::id();

        $users = User::where(function ($q) use ($query) {
            $q->where('username', 'LIKE', "%{$query}%")
                ->orWhere('display_name', 'LIKE', "%{$query}%");
        })
            ->where('id', '!=', $userId)
            ->take(10)
            ->get(['id', 'username', 'display_name', 'avatar_url']);

        // Check friendship status for each result
        $result = $users->map(function ($user) use ($userId) {
            $friendship = Friendship::where(function ($q) use ($userId, $user) {
                $q->where('sender_id', $userId)->where('receiver_id', $user->id);
            })->orWhere(function ($q) use ($userId, $user) {
                $q->where('sender_id', $user->id)->where('receiver_id', $userId);
            })->first();

            $status = 'none';
            if ($friendship) {
                if ($friendship->status === 'accepted') {
                    $status = 'friend';
                } elseif ($friendship->status === 'pending') {
                    $status = $friendship->sender_id === $userId ? 'sent' : 'received';
                }
            }

            $user->friendship_status = $status;
            return $user;
        });

        return response()->json($result);
    }
}
