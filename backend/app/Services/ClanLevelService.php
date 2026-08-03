<?php

namespace App\Services;

/**
 * The clan's single ladder. Level is earned from Clan XP and never bought;
 * the tier is derived from the level and gates what the base can build.
 * One number everywhere — there is no separate "citadel level".
 */
class ClanLevelService
{
    /** Tier floors, by level. Order matters: highest floor first wins. */
    private const TIERS = [
        [20, 5, 'Nexus'],
        [15, 4, 'Citadel'],
        [10, 3, 'Bastion'],
        [5, 2, 'Garrison'],
        [1, 1, 'Outpost'],
    ];

    /**
     * XP required to sit at a level. A power curve rounded to fifties:
     * L2 = 500, L5 ≈ 5,300, L10 ≈ 21,300, L20 ≈ 74,900 — a small active
     * clan reaches Garrison in weeks, Nexus is a long campaign.
     */
    public function xpForLevel(int $level): int
    {
        if ($level <= 1) {
            return 0;
        }

        return (int) (round(500 * pow($level - 1, 1.7) / 50) * 50);
    }

    public function levelForXp(int $xp): int
    {
        $level = 1;

        while ($this->xpForLevel($level + 1) <= max(0, $xp)) {
            $level++;
        }

        return $level;
    }

    /** @return array{tier:int,name:string} */
    public function tierForLevel(int $level): array
    {
        foreach (self::TIERS as [$floor, $tier, $name]) {
            if ($level >= $floor) {
                return ['tier' => $tier, 'name' => $name];
            }
        }

        return ['tier' => 1, 'name' => 'Outpost'];
    }

    /** Everything a progress bar needs, in one read. */
    public function progress(int $xp): array
    {
        $level = $this->levelForXp($xp);
        $start = $this->xpForLevel($level);
        $next = $this->xpForLevel($level + 1);

        return [
            'level' => $level,
            'tier' => $this->tierForLevel($level)['tier'],
            'tier_name' => $this->tierForLevel($level)['name'],
            'xp' => $xp,
            'level_start' => $start,
            'next_level_xp' => $next,
            'percent' => (int) round(min(100, max(0, ($xp - $start) / max(1, $next - $start) * 100))),
        ];
    }
}
