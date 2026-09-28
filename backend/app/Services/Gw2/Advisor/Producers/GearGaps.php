<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\CharacterView;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * Core slots below ascended, one signal per slot.
 *
 * Per slot rather than one "finish your ascended set", because the slots are not
 * interchangeable work. On the test account the three that are short are Ring2,
 * Accessory1 and Accessory2 — all trinkets, all obtainable from sources that have
 * nothing to do with each other, and a single card saying "3 slots left" tells
 * the player none of that.
 *
 * What this producer will not do is name a source. Where a particular ascended
 * trinket comes from is real knowledge, but it is not in the API and it is not in
 * our catalogue, so it belongs in a curated rule body or nowhere.
 */
class GearGaps implements Producer
{
    public const KEY = 'gear.slot_below_ascended';

    /**
     * Trinkets before armour before weapons.
     *
     * Not a claim about optimal play — it is the order in which a slot's absence
     * is most visible in the numbers, and it is here rather than in the rule
     * because it is mechanical: fewer stat sources means each missing one costs
     * proportionally more.
     */
    private const ORDER = [
        'Backpack' => 1, 'Amulet' => 2, 'Ring1' => 3, 'Ring2' => 4,
        'Accessory1' => 5, 'Accessory2' => 6,
        'Coat' => 7, 'Leggings' => 8, 'Helm' => 9,
        'Shoulders' => 10, 'Gloves' => 11, 'Boots' => 12,
    ];

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return [];
        }

        $slots = $character->slotsBelowAscended();

        usort($slots, fn ($a, $b) => (self::ORDER[$a] ?? 99) <=> (self::ORDER[$b] ?? 99));

        $signals = [];

        foreach ($slots as $slot) {
            $signals[] = new Signal(
                rule: $rule,
                subject: "slot:{$character->name}:{$slot}",
                facts: [
                    'character' => $character->name,
                    'slot' => $this->readable($slot),
                    'rarity' => $character->slotRarity[$slot] ?? 'nothing',
                    'ascended' => $character->ascendedSlots,
                    'total' => $character->coreSlots,
                    'remaining' => count($slots),
                ],
                blockers: $this->blockers($character),
                pushes: ['ascended_set:'.$character->name],
                details: array_filter([
                    // The exotic ring the card is about, not a generic glyph
                    // for "gear". Empty where the slot is empty, which is the
                    // one case where there is nothing to show a picture of.
                    'icon' => $character->slotItems[$slot]['icon'] ?? null,
                    'item' => $character->slotItems[$slot]['name'] ?? null,
                ]),
            );
        }

        return $signals;
    }

    /**
     * @return array<int, string>
     */
    private function blockers(CharacterView $character): array
    {
        /*
         * Ascended armour and weapons are crafted; trinkets mostly are not. A
         * character with no active crafting discipline therefore has a real
         * obstacle in front of half of this, and naming it is more useful than a
         * recommendation that quietly assumes otherwise.
         */
        return $character->craftingDisciplines === []
            ? ['No crafting discipline is active on this character — ascended armour and weapons are crafted.']
            : [];
    }

    /** `Ring1` is a slot name, not English. */
    private function readable(string $slot): string
    {
        return match ($slot) {
            'Ring1' => 'first ring',
            'Ring2' => 'second ring',
            'Accessory1' => 'first accessory',
            'Accessory2' => 'second accessory',
            'Backpack' => 'back item',
            'Coat' => 'chest',
            default => strtolower($slot),
        };
    }
}
