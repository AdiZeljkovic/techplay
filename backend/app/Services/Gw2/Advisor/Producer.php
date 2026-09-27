<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Rule;

/**
 * Turns one rule and one account into zero or more candidates.
 *
 * Producers hold the mechanics — reading the ledger, walking achievements,
 * counting slots. They hold no policy: no thresholds, no wording, no weights,
 * and no opinion about whether the advice is worth giving. Those live on the rule
 * row, which is why a producer never decides not to fire.
 *
 * Returning several candidates from one rule is normal and is the reason this is
 * not a simple boolean check: "you are one step from finishing this" applies to
 * eight achievements on the test account, and they are eight different evenings.
 */
interface Producer
{
    /** @return array<int, Signal> */
    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array;
}
