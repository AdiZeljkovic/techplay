<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function counts(Request $request)
    {
        $userId = Auth::id();

        // Count unread messages
        $unreadMessages = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('deleted_by_receiver', false)
            ->count();

        // Count pending friend requests
        $pendingRequests = Friendship::where('receiver_id', $userId)
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'unread_messages' => $unreadMessages,
            'pending_requests' => $pendingRequests,
            'total' => $unreadMessages + $pendingRequests
        ]);
    }
}
