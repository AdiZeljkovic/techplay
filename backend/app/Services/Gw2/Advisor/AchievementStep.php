<?php

namespace App\Services\Gw2\Advisor;

/**
 * One step of an achievement, and whether this account has done it.
 *
 * The text is ArenaNet's, verbatim. `bits[].text` on an achievement is written
 * by the people who made the content — "Somewhere in Necrotic Coast.", "Gorrik
 * could have picked this one up himself." — and the account's own achievement
 * record lists which of those indices are already ticked. Putting the two
 * together is the entire walkthrough, and it needs no third-party wiki, no
 * scraping and no editorial guess about what a step involves.
 *
 * That matters beyond convenience. Every other source for this is somebody
 * else's writing under somebody else's licence; this is the official API under
 * the terms we already accept to read an account at all.
 *
 * A step whose text the game does not give gets its name from the item it asks
 * for, which the catalogue already holds. Where neither exists — a mini or a
 * skin we do not mirror — `text` is null and the frontend draws it as an
 * unnamed step rather than inventing a description. §17.3: unknown renders as
 * unknown.
 */
readonly class AchievementStep
{
    public function __construct(
        public int $index,
        public ?string $text,
        public bool $done,
    ) {}
}
