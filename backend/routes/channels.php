<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Editorial Channels (public/private)
Broadcast::channel('editorial.channel.{slug}', function ($user, $slug) {
    // Check if user has access to this channel
    // We can reuse the logic from EditorialChat resource or policies
    // For now, allow any editorial user
    return $user->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'])
        || in_array($user->role ?? '', ['admin', 'super_admin']);
});

// User-specific channel for DMs
Broadcast::channel('editorial.user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// --- Real-Time Notification Channels ---

// Private user channel for notifications
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
