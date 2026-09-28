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
        /**
         * Every step, in the game's order, each flagged done or not.
         *
         * All of them rather than only what is left, because §3.1 asks for
         * "completed steps collapse" and a collapsed step still has to exist
         * to collapse. Empty where the achievement has no step list at all —
         * a counter like "kill 1,000 centaurs" has a number and no steps, and
         * that is a different thing from a step list we failed to read.
         *
         * @var array<int, AchievementStep>
         */
        public array $steps = [],
        /**
         * The mastery region this pays a point in, as the game spells it.
         *
         * Null for the overwhelming majority. 909 achievements carry one, and
         * they are the ones §12.1 wants lifted when the region is one the
         * reader still has tracks to train in.
         */
        public ?string $masteryRegion = null,
    ) {}

    /**
     * The steps still to do.
     *
     * @return array<int, AchievementStep>
     */
    public function remainingSteps(): array
    {
        return array_values(array_filter($this->steps, fn (AchievementStep $s) => ! $s->done));
    }

    /**
     * Whether we can name what is left.
     *
     * Not the same as having steps. An achievement can report 3 remaining
     * while its step list is unreadable, and a card that says "3 steps left"
     * with nothing under it should say so rather than render an empty list.
     */
    public function stepsKnown(): bool
    {
        return $this->steps !== [];
    }

    public function remaining(): int
    {
        return max(0, $this->max - $this->current);
    }

    public function ratio(): float
    {
        return $this->max > 0 ? $this->current / $this->max : 0.0;
    }
}
