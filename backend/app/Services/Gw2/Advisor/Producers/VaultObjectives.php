<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;
use App\Services\Gw2\Advisor\VaultObjective;

/**
 * Wizard's Vault objectives that are still open.
 *
 * The one place in this whole tool where nothing at all has to be inferred. Each
 * objective arrives from the API with its own title, its acclaim value, its
 * progress and its target. There is no threshold to pick, no source to look up
 * and no judgement to make — which makes these the highest-confidence things the
 * advisor can say, and they should outrank cleverer advice for exactly that
 * reason.
 *
 * Weeklies before dailies. A daily objective missed costs a day; a weekly missed
 * on Sunday costs a week, and the API gives no reset countdown to work that out
 * from, so the ordering carries it instead.
 */
class VaultObjectives implements Producer
{
    public const KEY = 'vault.open_objective';

    /** The dashboard has other things to say than five vault chores. */
    private const MOST = 4;

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        if (! $snapshot->vault) {
            return [];
        }

        $open = $snapshot->vault->open();

        usort($open, fn (VaultObjective $a, VaultObjective $b) => [
            $a->period === 'weekly' ? 0 : 1,
            -$a->acclaim,
        ] <=> [
            $b->period === 'weekly' ? 0 : 1,
            -$b->acclaim,
        ]);

        $signals = [];

        foreach (array_slice($open, 0, self::MOST) as $objective) {
            $signals[] = new Signal(
                rule: $rule,
                subject: "vault:{$objective->period}:{$objective->id}",
                facts: [
                    'title' => $objective->title,
                    'period' => $objective->period,
                    'acclaim' => $objective->acclaim,
                    'current' => $objective->current,
                    'target' => $objective->target,
                    'remaining' => $objective->remaining(),
                    'track' => $objective->track,
                    // Something already part-done reads differently from
                    // something untouched, and the difference is the whole
                    // reason a player would pick this one.
                    'started' => $objective->current > 0 ? 'yes' : 'no',
                ],
                blockers: [],
                pushes: ['astral_acclaim'],
            );
        }

        return $signals;
    }
}
