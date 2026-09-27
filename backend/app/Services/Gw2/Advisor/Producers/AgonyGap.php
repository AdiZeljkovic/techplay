<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\CharacterView;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * How much Agony Resistance is missing, and nothing beyond that.
 *
 * The test account sits at 20 AR from two +10 infusions, against the 150 that
 * Tier 4 fractals want. That gap is arithmetic and is safe to state.
 *
 * What this deliberately does **not** do is tell the player which tier they can
 * currently enter. The per-scale requirements are not in the API, are not in our
 * catalogue, and a table typed from memory would be exactly the kind of invented
 * number this project has been refusing all along. One sourced threshold, stated
 * as a target, is worth more than seven guessed ones stated as facts.
 */
class AgonyGap implements Producer
{
    public const KEY = 'fractals.agony_gap';

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character || $character->agonyShortfall() === 0) {
            return [];
        }

        return [new Signal(
            rule: $rule,
            subject: 'agony:'.$character->name,
            facts: [
                'character' => $character->name,
                'have' => $character->agonyResistance,
                'target' => CharacterView::TIER_4_AGONY,
                'short' => $character->agonyShortfall(),
                'fractal_level' => $snapshot->fractalLevel ?? 0,
            ],
            blockers: $this->blockers($character),
            pushes: ['fractal_tier:'.$character->name],
        )];
    }

    /**
     * @return array<int, string>
     */
    private function blockers(CharacterView $character): array
    {
        $blockers = [];

        /*
         * Infusions go in equipment slots, and only ascended and legendary gear
         * has them. A character in exotics cannot raise Agony Resistance at all
         * until the gear is replaced, so the gear gap is the real first step and
         * saying otherwise would send somebody shopping for infusions they
         * cannot socket.
         */
        $missing = count($character->slotsBelowAscended());

        if ($missing > 0) {
            $blockers[] = "{$missing} core slots are below ascended — infusions only socket into ascended or legendary gear.";
        }

        return $blockers;
    }
}
