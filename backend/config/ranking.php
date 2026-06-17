<?php

/**
 * Community Ranking tiers, driven by forum reputation. Each tier band is split
 * into three divisions (III lowest → I highest), e.g. "Bronze III".
 */
return [
    'tiers' => [
        ['name' => 'Bronze', 'min' => 0, 'color' => '#CD7F32'],
        ['name' => 'Silver', 'min' => 2000, 'color' => '#C0C0C0'],
        ['name' => 'Gold', 'min' => 5000, 'color' => '#FFD700'],
        ['name' => 'Platinum', 'min' => 10000, 'color' => '#67E8F9'],
        ['name' => 'Diamond', 'min' => 20000, 'color' => '#60A5FA'],
        ['name' => 'Master', 'min' => 40000, 'color' => '#C084FC'],
    ],

    // Weights used to compute a user's monthly contribution score.
    'contribution_weights' => [
        'post' => 5,
        'comment' => 2,
        'thread' => 10,
    ],
];
