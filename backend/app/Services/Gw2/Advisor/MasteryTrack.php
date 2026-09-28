<?php

namespace App\Services\Gw2\Advisor;

/**
 * One mastery track, with the account's place in it.
 *
 * A track is a ladder of tiers, each with its own point cost, and the costs rise
 * steeply — Itzel Lore runs 1, 2, 3, 5, 8, 12. That shape is why a track is the
 * useful unit here rather than a region total: somebody with three spare Heart of
 * Thorns points can finish the next tier of one track and not come close on
 * another, and only the per-tier cost says which.
 *
 * `tiersPaid` is `level + 1`, not `level` — see MasteryRegions for the arithmetic
 * that settled it.
 */
readonly class MasteryTrack
{
    /**
     * @param  array<int, int>  $tierCosts  Point cost of each tier, in order.
     * @param  array<int, string>  $tierNames
     */
    public function __construct(
        public int $id,
        public string $name,
        public ?string $requirement,
        public ?string $catalogueRegion,
        public ?string $region,
        public array $tierCosts,
        public array $tierNames,
        public int $tiersPaid,
    ) {}

    public function tiers(): int
    {
        return count($this->tierCosts);
    }

    public function finished(): bool
    {
        return $this->tiersPaid >= $this->tiers();
    }

    /** Never started: absent from the account's response entirely. */
    public function untouched(): bool
    {
        return $this->tiersPaid === 0;
    }

    public function pointsSpent(): int
    {
        return array_sum(array_slice($this->tierCosts, 0, $this->tiersPaid));
    }

    public function pointsTotal(): int
    {
        return array_sum($this->tierCosts);
    }

    /** What the next tier costs, or null when the track is done. */
    public function nextTierCost(): ?int
    {
        return $this->tierCosts[$this->tiersPaid] ?? null;
    }

    public function nextTierName(): ?string
    {
        return $this->tierNames[$this->tiersPaid] ?? null;
    }

    /**
     * Everything still to pay for.
     *
     * Worth showing beside the next tier's cost, because the two are very
     * different numbers: Itzel Lore's next tier may be 2 points while the rest of
     * the ladder is 28.
     */
    public function pointsRemaining(): int
    {
        return $this->pointsTotal() - $this->pointsSpent();
    }
}
