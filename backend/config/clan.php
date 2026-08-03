<?php

/*
 * The clan economy, in one file. Every number the system uses lives here so
 * a rebalance is a config change, never a code change. The full design is
 * docs/33-clan-system-plan.md — change that first, then this.
 */
return [

    /*
     * What each activity earns the actor's clan. Keyed by the reason string
     * written to the ledger, so the ledger doubles as a tuning audit.
     */
    'earn' => [
        'review_published' => ['resource' => 'intel', 'amount' => 15],
        'comment_approved' => ['resource' => 'intel', 'amount' => 3],
        'list_published' => ['resource' => 'intel', 'amount' => 10],
        'forum_solution' => ['resource' => 'intel', 'amount' => 10],
        'thread_popular' => ['resource' => 'intel', 'amount' => 5],

        'daily_login' => ['resource' => 'materials', 'amount' => 2],
        'game_completed' => ['resource' => 'materials', 'amount' => 15],
        'achievement_unlocked' => ['resource' => 'materials', 'amount' => 5],
        'session_logged' => ['resource' => 'materials', 'amount' => 3],
        'quest_completed' => ['resource' => 'materials', 'amount' => 5],
    ],

    /*
     * Per-member daily earning ceilings, per resource. One member cannot
     * carry — or farm — the clan, whatever they do all day.
     */
    'daily_caps' => [
        'intel' => 30,
        'materials' => 40,
        'prestige' => 50,
    ],

    /* A comment has to say something before it feeds the clan. */
    'comment_min_length' => 120,

    /* A journal session shorter than this is a note, not a session. */
    'session_min_minutes' => 30,

    /* Upvotes at which a thread counts as popular (awarded once, on crossing). */
    'thread_popular_upvotes' => 5,

    /*
     * Clan XP: what one unit of each resource contributes to the clan's
     * level climb. Prestige is rare, so it pulls harder.
     */
    'xp_weights' => [
        'intel' => 1,
        'materials' => 1,
        'prestige' => 5,
    ],

    /*
     * A member counts as active if they earned anything for the clan within
     * this window. Mission targets and leaderboard categories scale off
     * ACTIVE members, never the roster.
     */
    'active_window_days' => 14,

    /* Leaderboard size categories, by active members. */
    'size_categories' => [
        'small' => 15,   // ≤ 15 active
        'medium' => 50,  // 16–50 active
        // above = large
    ],
];
