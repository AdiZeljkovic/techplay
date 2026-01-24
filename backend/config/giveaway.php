<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Giveaway Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the giveaway system including reminders, limits, and
    | cache settings.
    |
    */

    'reminder' => [
        // Hours before giveaway end to send reminder emails
        'hours_before_end' => env('GIVEAWAY_REMINDER_HOURS', 24),

        // Tolerance window (± hours) for finding giveaways to remind
        'window_tolerance' => 1,

        // Maximum recipients per batch (prevent email bombing)
        'max_batch_size' => 100,
    ],

    'limits' => [
        // Default maximum points per user
        'max_points_per_user' => 100,

        // Maximum referrals counted per user
        'max_referrals' => 50,

        // Streak milestone bonuses (days => points)
        'streak_bonuses' => [
            3 => 5,
            7 => 10,
            14 => 20,
            30 => 50,
        ],
    ],

    'cache' => [
        // Cache TTL for leaderboard (seconds)
        'leaderboard_ttl' => 60,

        // Cache TTL for giveaway list
        'list_ttl' => 300, // 5 minutes

        // Cache TTL for single giveaway details
        'details_ttl' => 600, // 10 minutes
    ],

    'security' => [
        // Enable IP tracking for fraud detection
        'track_ip' => true,

        // Enable user agent tracking
        'track_user_agent' => true,

        // Maximum entries from same IP address
        'max_entries_per_ip' => 5,
    ],
];
