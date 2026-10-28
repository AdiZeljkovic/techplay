<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * Core slots with nothing in them, one signal per slot.
 *
 * Its own producer because an empty slot and a low-rarity one are different
 * subjects, and the rule that says "Nothing equipped in the {slot}" was for a
 * while fed by GearGaps — which only ever emits slots that *have* something in
 * them. With one empty slot on a character, the rule's condition held, and its
 * sentence went out over every exotic ring and accessory the character was
 * actually wearing, while the slot that really was empty got no card at all.
 *
 * The subject matches GearGaps' on purpose (`slot:{character}:{slot}`): one slot,
 * one card, whichever rule has the better claim to it.
 */
class EmptyCoreSlots implements Producer
{
    public const KEY = 'gear.empty_core_slot';

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return [];
        }

        $empty = $character->emptySlots();
        $action = GearGaps::action();
        $signals = [];

        foreach ($empty as $slot) {
            $signals[] = new Signal(
                rule: $rule,
                subject: "slot:{$character->name}:{$slot}",
                facts: [
                    'character' => $character->name,
                    'slot' => GearGaps::readable($slot),
                    'ascended' => $character->ascendedSlots,
                    'total' => $character->coreSlots,
                    'remaining' => count($empty),
                ],
                blockers: [],
                pushes: ['ascended_set:'.$character->name],
                details: array_filter([
                    'progress' => GearGaps::progress($character),
                    'action' => $action,
                ]),
            );
        }

        return $signals;
    }
}
