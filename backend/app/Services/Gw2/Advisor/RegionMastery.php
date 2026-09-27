<?php

namespace App\Services\Gw2\Advisor;

/**
 * Mastery points in one region.
 *
 * Earned and spent are both per region and do not move between them — points
 * earned in Heart of Thorns cannot be spent on a Path of Fire track. That is
 * why this is a region object and not two account totals: "you have 7 unspent
 * points" is useless if all seven are in a region whose tracks are finished.
 */
readonly class RegionMastery
{
    public function __construct(
        public string $region,
        public int $earned,
        public int $spent,
    ) {}

    public function unspent(): int
    {
        return max(0, $this->earned - $this->spent);
    }
}
