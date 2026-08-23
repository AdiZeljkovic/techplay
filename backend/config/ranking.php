<?php

/**
 * Community Standing levels, driven by forum reputation. Each band is split
 * into three divisions (III lowest → I highest), e.g. "Contributor II".
 *
 * Deliberately NOT metal names — Bronze/Silver/Gold belongs exclusively to
 * the XP Rank ladder so users can tell the two progressions apart. The names
 * still stand apart; the artwork below is shared, which is a different thing.
 *
 * Each tier carries an insignia from the site's commissioned rank set. The
 * card that draws this was showing a hex plate with a cardboard-box glyph
 * inside it — a lucide placeholder standing in for artwork we already own.
 * The emblems carry no lettering, so an emblem is not a claim about which
 * ladder it belongs to; the tier name beside it is.
 *
 * The six chosen skip `newcomer`, `player`, `rookie` and `bronze`, which are
 * the XP ranks nearly every account on the site currently wears — those are
 * the four most likely to end up on screen twice, once in the hero and once
 * in this card.
 */
return [
    'tiers' => [
        ['name' => 'Rookie', 'min' => 0, 'color' => '#9CA3AF', 'icon' => '/ranks/silver.webp'],
        ['name' => 'Contributor', 'min' => 2000, 'color' => '#4ADE80', 'icon' => '/ranks/gold.webp'],
        ['name' => 'Regular', 'min' => 5000, 'color' => '#60A5FA', 'icon' => '/ranks/platinum.webp'],
        ['name' => 'Veteran', 'min' => 10000, 'color' => '#A78BFA', 'icon' => '/ranks/diamond.webp'],
        ['name' => 'Elite', 'min' => 20000, 'color' => '#FBBF24', 'icon' => '/ranks/master.webp'],
        ['name' => 'Legend', 'min' => 40000, 'color' => '#FC4100', 'icon' => '/ranks/grandmaster.webp'],
    ],

    // Weights used to compute a user's monthly contribution score.
    'contribution_weights' => [
        'post' => 5,
        'comment' => 2,
        'thread' => 10,
    ],
];
