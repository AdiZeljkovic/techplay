<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * Acclaim already earned and not collected.
 *
 * The best recommendation an advisor can give is one that costs the player
 * nothing. `claimed` and `done` are separate fields on every vault objective, so
 * work that is finished but uncollected is directly readable — no estimate, no
 * threshold, and no way to be wrong about it.
 *
 * It also expires. The vault resets, and an unclaimed objective resets with it,
 * so this is the one piece of advice in the tool where the cost of ignoring it is
 * certain rather than notional.
 */
class UnclaimedAcclaim implements Producer
{
    public const KEY = 'vault.unclaimed';

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        if (! $snapshot->vault || $snapshot->vault->unclaimedAcclaim() === 0) {
            return [];
        }

        $unclaimed = array_values(array_filter(
            [...$snapshot->vault->daily, ...$snapshot->vault->weekly],
            fn ($o) => $o->done() && ! $o->claimed
        ));

        return [new Signal(
            rule: $rule,
            subject: 'vault:unclaimed',
            facts: [
                'acclaim' => $snapshot->vault->unclaimedAcclaim(),
                'count' => count($unclaimed),
                'objective' => count($unclaimed) === 1 ? 'objective' : 'objectives',
                'first' => $unclaimed[0]->title ?? '',
            ],
            blockers: [],
            pushes: ['astral_acclaim'],
        )];
    }
}
