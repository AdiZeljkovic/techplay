<?php

namespace App\Services\Gw2\Advisor;

/**
 * The Wizard's Vault, daily and weekly.
 *
 * The richest thing the API hands over and the one place an advisor needs no
 * judgement at all: each objective arrives with its own title, its acclaim
 * value, its progress and whether it has been claimed. Nothing has to be
 * inferred, so nothing can be got wrong.
 *
 * `claimed` and `done` are separate states and both matter. An objective that is
 * finished but unclaimed is free acclaim sitting there, which is a better thing
 * to tell somebody than any recommendation the engine could compute.
 */
readonly class VaultView
{
    /**
     * @param  array<int, VaultObjective>  $daily
     * @param  array<int, VaultObjective>  $weekly
     */
    public function __construct(
        public array $daily,
        public array $weekly,
        public bool $dailyMetaClaimed,
        public bool $weeklyMetaClaimed,
        public int $dailyMetaProgress,
        public int $dailyMetaTarget,
        public int $weeklyMetaProgress,
        public int $weeklyMetaTarget,
    ) {}

    /** Finished, not claimed. Acclaim already earned and not collected. */
    public function unclaimedAcclaim(): int
    {
        return array_sum(array_map(
            fn (VaultObjective $o) => $o->done() && ! $o->claimed ? $o->acclaim : 0,
            [...$this->daily, ...$this->weekly]
        ));
    }

    /** @return array<int, VaultObjective> */
    public function open(): array
    {
        return array_values(array_filter(
            [...$this->daily, ...$this->weekly],
            fn (VaultObjective $o) => ! $o->done()
        ));
    }
}
