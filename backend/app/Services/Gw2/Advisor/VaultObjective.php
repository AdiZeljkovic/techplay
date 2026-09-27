<?php

namespace App\Services\Gw2\Advisor;

/** One Wizard's Vault objective, exactly as the API words it. */
readonly class VaultObjective
{
    public function __construct(
        public int $id,
        public string $title,
        public string $track,
        public int $acclaim,
        public bool $claimed,
        public int $current,
        public int $target,
        public string $period,
    ) {}

    public function done(): bool
    {
        return $this->target > 0 && $this->current >= $this->target;
    }

    public function remaining(): int
    {
        return max(0, $this->target - $this->current);
    }
}
