<?php

namespace App\Services\Gw2\Advisor;

/**
 * What the player asked for, as far as they said anything.
 *
 * Every field is optional and the empty Intent is the normal case — somebody who
 * just opened the page has stated nothing, and the advisor must still be useful.
 * Nothing here is inferred from behaviour: guessing that a player "probably wants
 * fractals" because they ran one is how a tool starts arguing with its user.
 *
 * `avoid` exists because the most common thing a player wants from an advisor is
 * for it to stop suggesting the one activity they do not enjoy. That is a
 * preference, not a fact about their account, so it is passed in rather than
 * derived.
 */
readonly class Intent
{
    /**
     * @param  string|null  $goal  A rule domain to favour, e.g. 'fractals'.
     * @param  int|null  $minutes  How long they have; null means no limit stated.
     * @param  array<int, string>  $avoid  Domains to drop entirely.
     */
    public function __construct(
        public ?string $goal = null,
        public ?int $minutes = null,
        public array $avoid = [],
    ) {}

    /**
     * Effort bands that fit the time available.
     *
     * The boundaries are ours and are honest about being ours: `quick` is
     * something finishable in a few minutes, `session` is an evening, `long` is
     * a project measured in weeks. They are not the game's categories because
     * the game has none.
     *
     * @return array<int, string>
     */
    public function bandsThatFit(): array
    {
        if ($this->minutes === null) {
            return ['quick', 'session', 'long'];
        }

        return match (true) {
            $this->minutes <= 30 => ['quick'],
            $this->minutes <= 120 => ['quick', 'session'],
            default => ['quick', 'session', 'long'],
        };
    }

    public function rejects(string $domain): bool
    {
        return in_array($domain, $this->avoid, true);
    }
}
