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

    /*
     * Missions. Weekly slots follow Mission Control (1, +1 at L5, +1 at
     * L10); operations open at L3. One member can push a mission at most
     * this many points per day - Travian's lesson: a collective goal one
     * player can finish alone isn't collective.
     */
    'mission_daily_member_cap' => 10,
    'mission_scale_exponent' => 0.8,
    'mission_scale_baseline' => 10,

    /*
     * Boosters. Officer-activated, time-limited, paid from the treasury.
     * One running at a time (a Vault at L6 adds a second slot); each key
     * has its own cooldown measured from when the last run ended.
     */
    'boosters' => [
        'achievement_hunt' => [
            'name' => 'Achievement Hunt',
            'description' => 'Double Materials from every achievement unlocked.',
            'duration_hours' => 24,
            'cooldown_hours' => 72,
            'cost' => ['resource' => 'materials', 'amount' => 800],
            'effect' => ['type' => 'earn_multiplier', 'reasons' => ['achievement_unlocked'], 'multiplier' => 2.0],
        ],
        'backlog_weekend' => [
            'name' => 'Backlog Weekend',
            'description' => 'Double Materials from every game completed.',
            'duration_hours' => 48,
            'cooldown_hours' => 120,
            'cost' => ['resource' => 'materials', 'amount' => 1200],
            'effect' => ['type' => 'earn_multiplier', 'reasons' => ['game_completed'], 'multiplier' => 2.0],
        ],
        'community_rally' => [
            'name' => 'Community Rally',
            'description' => '+50% Intel from comments, reviews and lists.',
            'duration_hours' => 24,
            'cooldown_hours' => 72,
            'cost' => ['resource' => 'intel', 'amount' => 800],
            'effect' => ['type' => 'earn_multiplier', 'reasons' => ['comment_approved', 'review_published', 'list_published'], 'multiplier' => 1.5],
        ],
        'double_contribution' => [
            'name' => 'Double Contribution Hour',
            'description' => 'Mission progress counts twice while it runs.',
            'duration_hours' => 1,
            'cooldown_hours' => 24,
            'cost' => ['resource' => 'materials', 'amount' => 500],
            'effect' => ['type' => 'mission_multiplier', 'multiplier' => 2],
        ],
        'recruitment_signal' => [
            'name' => 'Recruitment Signal',
            'description' => 'The clan is featured in Discovery for a day.',
            'duration_hours' => 24,
            'cooldown_hours' => 96,
            'cost' => ['resource' => 'prestige', 'amount' => 300],
            'effect' => ['type' => 'discovery_feature'],
        ],
    ],

    /* Vault level at which a second booster can run alongside the first. */
    'boost_second_slot_vault' => 6,

    /*
     * Season settlement: Prestige paid to the podium (overall, by season
     * ledger earn) and to the best clan of each size category.
     */
    'season_rewards' => [
        'overall' => [1000, 600, 300],
        'category' => 400,
    ],
];
