<?php

/**
 * There was a second ladder here.
 *
 * Six "Community Standing" tiers driven by forum reputation, each split into
 * three divisions — Rookie III up to Legend I. It was removed on 24.08.2026
 * because it was never a ladder in practice, only in shape:
 *
 *   its first promotion sat at 2,000 reputation, and reputation moves ±1 per
 *   forum vote and +10 per accepted solution. The site record is 68, across 53
 *   accounts, of which two have any at all. Every profile on the site read
 *   "Rookie III · Top 100% of the community" — no rung had ever been climbed,
 *   and none could be at that calibration;
 *
 *   and four of its six names — Rookie, Veteran, Elite, Legend — are also XP
 *   rank names, so a reader saw "Noob" in the hero and "Rookie III" in the
 *   sidebar of the same profile and reported a bug. There was no bug. There
 *   were two ladders wearing each other's words.
 *
 * The site has one progression that moves — XP → level and rank — and the
 * Standing card draws that now. Reputation is still counted, still ranks the
 * leaderboard, and is no longer dressed as a rank. If the forum ever fills,
 * a ladder can come back with thresholds set from numbers that exist.
 */
return [
    // Weights used to compute a user's monthly contribution score.
    'contribution_weights' => [
        'post' => 5,
        'comment' => 2,
        'thread' => 10,
    ],
];
