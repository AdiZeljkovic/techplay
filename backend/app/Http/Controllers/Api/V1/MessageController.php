<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_username' => 'required|exists:users,username',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        $receiver = User::where('username', $validated['receiver_username'])->firstOrFail();

        // Prevent self-messaging
        if ($receiver->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot message yourself'], 422);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $receiver->id,
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'is_read' => false,
        ]);

        return response()->json($message, 201);
    }

    public function index(Request $request)
    {
        $messages = Message::where('receiver_id', $request->user()->id)
            ->with('sender:id,username')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($messages);
    }

    public function markRead(Request $request, $id)
    {
        $message = Message::where('id', $id)
            ->where('receiver_id', $request->user()->id)
            ->firstOrFail();

        $message->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read']);
    }
}
