<?php

namespace App\Services;

/**
 * The XP → level curve.
 *
 * Levels used to be a flat floor(xp/1000)+1, which put the first four ranks
 * inside level 1 and made the top of the ladder unreachable. The curve is now
 * anchored to the rank ladder: each rank lands on a chosen level, and levels
 * in between are spread evenly across that band. Levels therefore cost more
 * XP the higher you climb — 250 XP each between Silver and Gold, ~3.8k each
 * past Apex.
 *
 * Anchors are [xp, level] and must stay sorted by xp.
 */
class LevelService
{
    /** @var array<int, array{0:int, 1:int}> */
    private const ANCHORS = [
        [0, 1],          // Newcomer
        [100, 2],        // Player
        [300, 3],        // Rookie
        [600, 5],        // Bronze
        [1000, 7],       // Silver
        [2000, 11],      // Gold
        [3500, 15],      // Platinum
        [5000, 19],      // Diamond
        [7500, 24],      // Master
        [10000, 28],     // Grandmaster
        [15000, 35],     // Challenger
        [20000, 41],     // Elite
        [30000, 51],     // Veteran
        [45000, 63],     // Legend
        [60000, 74],     // Mythic
        [80000, 86],     // Immortal
        [100000, 96],    // Ascendant
        [150000, 119],   // Radiant
        [250000, 154],   // Apex
        [500000, 220],   // Eternal
    ];

    /** XP per level beyond the final anchor, taken from the last band's slope. */
    private const XP_PER_LEVEL_BEYOND = 3788;

    public function forXp(?int $xp): int
    {
        $xp = max(0, (int) $xp);
        $anchors = self::ANCHORS;
        $last = end($anchors);

        if ($xp >= $last[0]) {
            return $last[1] + intdiv($xp - $last[0], self::XP_PER_LEVEL_BEYOND);
        }

        for ($i = count($anchors) - 2; $i >= 0; $i--) {
            [$lowXp, $lowLevel] = $anchors[$i];

            if ($xp < $lowXp) {
                continue;
            }

            [$highXp, $highLevel] = $anchors[$i + 1];
            $levels = $highLevel - $lowLevel;

            if ($levels <= 0) {
                return $lowLevel;
            }

            $perLevel = ($highXp - $lowXp) / $levels;

            return $lowLevel + (int) floor(($xp - $lowXp) / $perLevel);
        }

        return 1;
    }

    /** The XP at which a level begins — the inverse of forXp(). */
    public function xpForLevel(int $level): int
    {
        $level = max(1, $level);
        $anchors = self::ANCHORS;
        $last = end($anchors);

        if ($level >= $last[1]) {
            return $last[0] + ($level - $last[1]) * self::XP_PER_LEVEL_BEYOND;
        }

        for ($i = count($anchors) - 2; $i >= 0; $i--) {
            [$lowXp, $lowLevel] = $anchors[$i];

            if ($level < $lowLevel) {
                continue;
            }

            [$highXp, $highLevel] = $anchors[$i + 1];
            $levels = $highLevel - $lowLevel;

            if ($levels <= 0) {
                return $lowXp;
            }

            return (int) ceil($lowXp + ($level - $lowLevel) * (($highXp - $lowXp) / $levels));
        }

        return 0;
    }

    /**
     * Progress through the current level.
     *
     * @return array{level:int, current_xp:int, level_start:int, next_level_xp:int, percent:int}
     */
    public function progress(?int $xp): array
    {
        $xp = max(0, (int) $xp);
        $level = $this->forXp($xp);
        $start = $this->xpForLevel($level);
        $next = $this->xpForLevel($level + 1);
        $span = max(1, $next - $start);

        return [
            'level' => $level,
            'current_xp' => $xp,
            'level_start' => $start,
            'next_level_xp' => $next,
            'percent' => (int) round(min(100, max(0, ($xp - $start) / $span * 100))),
        ];
    }
}
