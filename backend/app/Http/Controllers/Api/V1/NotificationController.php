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

        // Count unread forum reply notifications
        $forumReplies = \Illuminate\Support\Facades\DB::table('notifications')
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->whereRaw("JSON_EXTRACT(data, '$.type') = 'forum_reply'")
            ->count();

        return response()->json([
            'unread_messages' => $unreadMessages,
            'pending_requests' => $pendingRequests,
            'forum_replies' => $forumReplies,
            'total' => $unreadMessages + $pendingRequests + $forumReplies
        ]);
    }
}
