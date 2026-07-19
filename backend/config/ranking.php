<?php

/**
 * Community Standing levels, driven by forum reputation. Each band is split
 * into three divisions (III lowest → I highest), e.g. "Contributor II".
 *
 * Deliberately NOT metal names — Bronze/Silver/Gold belongs exclusively to
 * the XP Rank ladder so users can tell the two progressions apart.
 */
return [
    'tiers' => [
        ['name' => 'Rookie', 'min' => 0, 'color' => '#9CA3AF'],
        ['name' => 'Contributor', 'min' => 2000, 'color' => '#4ADE80'],
        ['name' => 'Regular', 'min' => 5000, 'color' => '#60A5FA'],
        ['name' => 'Veteran', 'min' => 10000, 'color' => '#A78BFA'],
        ['name' => 'Elite', 'min' => 20000, 'color' => '#FBBF24'],
        ['name' => 'Legend', 'min' => 40000, 'color' => '#FC4100'],
    ],

    // Weights used to compute a user's monthly contribution score.
    'contribution_weights' => [
        'post' => 5,
        'comment' => 2,
        'thread' => 10,
    ],
];
