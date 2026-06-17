<?php

/**
 * Contribution Milestones shown on the profile dashboard.
 * Each milestone's `metric` maps to a key produced by ProfileService::milestoneMetrics().
 * Progress is computed live (current vs target); no per-user storage needed.
 */
return [
    ['key' => 'forum_posts', 'label' => 'Make 100 Forum Posts', 'metric' => 'forum_posts', 'target' => 100, 'icon' => 'message-square'],
    ['key' => 'discussions', 'label' => 'Start 25 Discussions', 'metric' => 'threads', 'target' => 25, 'icon' => 'message-circle'],
    ['key' => 'wishlist', 'label' => 'Add 10 Games to Wishlist', 'metric' => 'wishlist', 'target' => 10, 'icon' => 'heart'],
    ['key' => 'track_games', 'label' => 'Track 50 Games', 'metric' => 'games', 'target' => 50, 'icon' => 'gamepad-2'],
    ['key' => 'reputation', 'label' => 'Earn 500 Reputation', 'metric' => 'reputation', 'target' => 500, 'icon' => 'star'],
];
