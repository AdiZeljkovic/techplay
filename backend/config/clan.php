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

    /*
     * The base. Eight buildings, each 0-10. `requires_cc` gates construction
     * behind the Command Center level; costs follow base x level^1.6.
     * Effects that have no system yet (missions, cosmetics, polls) unlock in
     * later phases - the building can be raised now, and says so honestly.
     */
    'buildings' => [
        'command_center' => ['name' => 'Command Center', 'requires_cc' => 0, 'base_cost' => ['intel' => 150, 'materials' => 250]],
        'mission_control' => ['name' => 'Mission Control', 'requires_cc' => 1, 'base_cost' => ['intel' => 120, 'materials' => 180]],
        'training_grounds' => ['name' => 'Training Grounds', 'requires_cc' => 1, 'base_cost' => ['intel' => 80, 'materials' => 220]],
        'vault' => ['name' => 'Vault', 'requires_cc' => 1, 'base_cost' => ['intel' => 100, 'materials' => 200]],
        'trophy_hall' => ['name' => 'Trophy Hall', 'requires_cc' => 2, 'base_cost' => ['intel' => 140, 'materials' => 160]],
        'archive' => ['name' => 'Archive', 'requires_cc' => 3, 'base_cost' => ['intel' => 250, 'materials' => 100]],
        'workshop' => ['name' => 'Workshop', 'requires_cc' => 4, 'base_cost' => ['intel' => 150, 'materials' => 250]],
        'communications_hub' => ['name' => 'Communications Hub', 'requires_cc' => 5, 'base_cost' => ['intel' => 220, 'materials' => 180]],
    ],

    'building_max_level' => 10,

    /* cost(target) = base x target^this, rounded to tens. */
    'cost_exponent' => 1.6,

    /* Construction runs target_level x this many hours once funded. */
    'build_hours_per_level' => 6,

    /* Speed-up: Prestige per remaining hour, with a floor. */
    'speedup_prestige_per_hour' => 30,
    'speedup_prestige_min' => 100,

    /* Command Center: +this many roster slots per level. */
    'member_slots_per_cc_level' => 10,

    /* Vault: each resource is capped at base + per_level x level. */
    'vault_capacity_base' => 10000,
    'vault_capacity_per_level' => 10000,

    /* Training Grounds: +this % clan XP per level on achievement earns. */
    'training_xp_percent_per_level' => 2,
];
