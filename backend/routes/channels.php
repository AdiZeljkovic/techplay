<?php

use App\Models\ConversationParticipant;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// --- Real-Time Notification Channels ---

// Private user channel for notifications
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// --- Chat ---

// Only the people in a conversation may listen to it. Without this the
// message body of every DM was readable by anyone with the public key.
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return ConversationParticipant::where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});

// The personal inbox nudge — yours alone.
Broadcast::channel('user.{id}.chat', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
