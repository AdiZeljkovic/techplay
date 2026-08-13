<?php

namespace App\Services;

use App\Models\Rank;

/**
 * What this request earned, so the page can say so.
 *
 * Everything the site pays out — XP, bounty, a rank promotion, an unlocked
 * achievement — happened silently on the server and appeared, if at all, on the
 * next page load. Adding a game paid ten XP and looked exactly like nothing
 * happening.
 *
 * Rather than change a hundred controllers to return their rewards, the
 * services that award them drop a line here and one middleware attaches the
 * lot to whatever JSON is going back. Request-scoped: a singleton in Laravel's
 * container lives and dies with the request, so there is no cross-request
 * bleed and nothing to clear.
 */
class RewardLedger
{
    /** @var array<int, array{type:string, amount:int, reason:?string}> */
    private array $entries = [];

    /** @var array<int, array{name:string, icon:?string}> */
    private array $unlocks = [];

    private ?array $promotion = null;

    public function xp(int $amount, ?string $reason = null): void
    {
        $this->add('xp', $amount, $reason);
    }

    public function bounty(int $amount, ?string $reason = null): void
    {
        $this->add('bounty', $amount, $reason);
    }

    /** An achievement that came true during this request. */
    public function unlocked(string $name, ?string $icon = null): void
    {
        $this->unlocks[] = ['name' => $name, 'icon' => $icon];
    }

    /**
     * A rank promotion. Only ever one per request — you cannot climb two rungs
     * on a single comment, and if the ladder is re-thresholded so that you
     * could, the top one is the one worth announcing.
     */
    public function promoted(Rank $rank): void
    {
        $this->promotion = [
            'name' => $rank->name,
            'color' => $rank->color,
            'icon' => $rank->icon,
        ];
    }

    public function isEmpty(): bool
    {
        return $this->entries === [] && $this->unlocks === [] && $this->promotion === null;
    }

    /**
     * Totals rather than a transcript. Three separate "+5 XP" from one action
     * is an implementation detail; "+15 XP" is what happened.
     */
    public function toArray(): array
    {
        $totals = [];

        foreach ($this->entries as $entry) {
            $totals[$entry['type']] = ($totals[$entry['type']] ?? 0) + $entry['amount'];
        }

        return array_filter([
            'xp' => $totals['xp'] ?? null,
            'bounty' => $totals['bounty'] ?? null,
            'unlocked' => $this->unlocks ?: null,
            'promoted' => $this->promotion,
        ], fn ($value) => $value !== null);
    }

    private function add(string $type, int $amount, ?string $reason): void
    {
        if ($amount === 0) {
            return;
        }

        $this->entries[] = ['type' => $type, 'amount' => $amount, 'reason' => $reason];
    }
}
