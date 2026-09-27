<?php

namespace App\Services\Gw2\Advisor;

/**
 * One character, with the gear questions already answered.
 *
 * Two of these numbers are the reason this class exists rather than a raw array.
 *
 * **Agony Resistance** is summed from the infusions in the worn set and from
 * nothing else. Totalling an inactive build's infusions would report armour the
 * player is not wearing, which is the one number a fractal tier check must not
 * get wrong.
 *
 * **Ascended slots** counts twelve, not twenty-three. The worn set on the test
 * account includes a fishing rod, three gathering tools, an aquabreather and two
 * aquatic weapons — none of which has an ascended tier that matters to anything.
 * Counting them would report 11/23 for a character in full ascended armour.
 */
readonly class CharacterView
{
    /**
     * The slots an ascended progress figure is allowed to count.
     *
     * Six armour and six trinkets. Weapons are left out on purpose: a build may
     * hold one two-handed weapon or four one-handed ones, so "weapons done" has
     * no fixed denominator and is reported separately.
     */
    public const CORE_SLOTS = [
        'Helm', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots',
        'Backpack', 'Amulet', 'Ring1', 'Ring2', 'Accessory1', 'Accessory2',
    ];

    /**
     * @param  array<string, string>  $slotRarity  Slot => rarity, core slots only.
     * @param  array<int, string>  $craftingDisciplines
     */
    public function __construct(
        public string $name,
        public ?string $profession,
        public ?string $race,
        public int $level,
        public int $agonyResistance,
        public int $ascendedSlots,
        public int $coreSlots,
        public array $slotRarity,
        public int $ascendedWeapons,
        public int $weaponSlots,
        public array $craftingDisciplines,
        public ?int $deaths,
    ) {}

    /** Core slots still below ascended, in the order a player would fill them. */
    public function slotsBelowAscended(): array
    {
        return array_values(array_filter(
            self::CORE_SLOTS,
            fn (string $slot) => isset($this->slotRarity[$slot])
                && ! in_array($this->slotRarity[$slot], ['Ascended', 'Legendary'], true)
        ));
    }

    /** Core slots with nothing equipped at all — a different problem from a low rarity. */
    public function emptySlots(): array
    {
        return array_values(array_filter(
            self::CORE_SLOTS,
            fn (string $slot) => ! isset($this->slotRarity[$slot])
        ));
    }

    /**
     * Agony Resistance still missing for the Tier 4 target.
     *
     * 150 is the only threshold modelled here, and it is modelled because it is
     * the figure the game's own fractal reward tracks and every group in the
     * mode ask for. The finer per-scale steps are **deliberately absent**: they
     * are not in the API anywhere, our catalogue does not carry them, and a
     * table typed from memory would be the advisor's first invented number.
     *
     * Until somebody sources them, a player between tiers is told what they
     * have and what T4 wants, which is true, rather than a tier verdict that
     * might not be.
     */
    public const TIER_4_AGONY = 150;

    public function agonyShortfall(): int
    {
        return max(0, self::TIER_4_AGONY - $this->agonyResistance);
    }
}
