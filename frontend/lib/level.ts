/**
 * XP → level curve. Mirrors backend/app/Services/LevelService.php — if you
 * change one, change the other, or the header and the profile will disagree.
 *
 * Anchored to the rank ladder: each rank lands on a chosen level and the
 * levels between are spread evenly, so levels cost more the higher you climb.
 */
const ANCHORS: [xp: number, level: number][] = [
    [0, 1],        // Newcomer
    [100, 2],      // Player
    [300, 3],      // Rookie
    [600, 5],      // Bronze
    [1000, 7],     // Silver
    [2000, 11],    // Gold
    [3500, 15],    // Platinum
    [5000, 19],    // Diamond
    [7500, 24],    // Master
    [10000, 28],   // Grandmaster
    [15000, 35],   // Challenger
    [20000, 41],   // Elite
    [30000, 51],   // Veteran
    [45000, 63],   // Legend
    [60000, 74],   // Mythic
    [80000, 86],   // Immortal
    [100000, 96],  // Ascendant
    [150000, 119], // Radiant
    [250000, 154], // Apex
    [500000, 220], // Eternal
];

const XP_PER_LEVEL_BEYOND = 3788;

export function levelForXp(xp: number | null | undefined): number {
    const value = Math.max(0, Math.floor(xp ?? 0));
    const last = ANCHORS[ANCHORS.length - 1];

    if (value >= last[0]) {
        return last[1] + Math.floor((value - last[0]) / XP_PER_LEVEL_BEYOND);
    }

    for (let i = ANCHORS.length - 2; i >= 0; i--) {
        const [lowXp, lowLevel] = ANCHORS[i];
        if (value < lowXp) continue;

        const [highXp, highLevel] = ANCHORS[i + 1];
        const levels = highLevel - lowLevel;
        if (levels <= 0) return lowLevel;

        return lowLevel + Math.floor((value - lowXp) / ((highXp - lowXp) / levels));
    }

    return 1;
}

/** The XP at which a level begins — the inverse of levelForXp(). */
export function xpForLevel(level: number): number {
    const target = Math.max(1, Math.floor(level));
    const last = ANCHORS[ANCHORS.length - 1];

    if (target >= last[1]) {
        return last[0] + (target - last[1]) * XP_PER_LEVEL_BEYOND;
    }

    for (let i = ANCHORS.length - 2; i >= 0; i--) {
        const [lowXp, lowLevel] = ANCHORS[i];
        if (target < lowLevel) continue;

        const [highXp, highLevel] = ANCHORS[i + 1];
        const levels = highLevel - lowLevel;
        if (levels <= 0) return lowXp;

        return Math.ceil(lowXp + (target - lowLevel) * ((highXp - lowXp) / levels));
    }

    return 0;
}
