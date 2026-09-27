<?php

namespace App\Services\Gw2\Advisor;

/**
 * An achievement close enough to finishing to be worth mentioning.
 *
 * The account carries 807 tracked achievements, 443 of them part-done. Almost
 * all of that is noise: an achievement at 546/1000 is not something anybody is
 * about to finish tonight. What makes this useful is the ratio plus a name, and
 * the name only exists because the catalogue is mirrored locally — looking up
 * 443 achievements against the API would cost more requests than a whole
 * account sync.
 */
readonly class EasyWin
{
    public function __construct(
        public int $id,
        public ?string $name,
        public ?string $requirement,
        public int $current,
        public int $max,
        public ?string $effortBand,
        public bool $curated,
    ) {}

    public function remaining(): int
    {
        return max(0, $this->max - $this->current);
    }

    public function ratio(): float
    {
        return $this->max > 0 ? $this->current / $this->max : 0.0;
    }
}
