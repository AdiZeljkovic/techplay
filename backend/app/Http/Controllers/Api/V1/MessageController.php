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
            'parent_id' => 'nullable|exists:messages,id',
        ]);

        $receiver = User::where('username', $validated['receiver_username'])->firstOrFail();

        // Prevent self-messaging
        if ($receiver->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot message yourself'], 422);
        }

        $message = Message::create([
            'parent_id' => $validated['parent_id'] ?? null,
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
        // Fetch threads where I am the receiver and I haven't deleted them
        $messages = Message::where('receiver_id', $request->user()->id)
            ->where('deleted_by_receiver', false)
            ->with(['sender:id,username,avatar_url', 'parent'])
            // Assuming User model has avatar or avatar_url. Previously saw avatar_url in frontend.
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

    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        $userId = $request->user()->id;

        if ($message->receiver_id === $userId) {
            $message->update(['deleted_by_receiver' => true]);
        } elseif ($message->sender_id === $userId) {
            $message->update(['deleted_by_sender' => true]);
        } else {
            abort(403, 'Unauthorized');
        }

        return response()->json(['message' => 'Message deleted']);
    }
}
