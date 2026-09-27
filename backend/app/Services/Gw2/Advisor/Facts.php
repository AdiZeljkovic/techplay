<?php

namespace App\Services\Gw2\Advisor;

/**
 * The snapshot flattened into the only vocabulary a rule may reference.
 *
 * Deliberately small and deliberately enumerable. A rule's `requires` is data
 * edited in an admin panel, so an editor has to be able to be shown the list of
 * things they can ask about; a general expression language over the whole
 * snapshot would be a second programming language with no tests and no
 * autocomplete.
 *
 * Adding a fact is a code change on purpose. That is the gate that stops the
 * rule table from quietly growing a dependency on some nested API shape.
 */
class Facts
{
    /**
     * @return array<string, int|float|bool|string|null>
     */
    public static function from(Snapshot $snapshot): array
    {
        $character = $snapshot->primaryCharacter();

        $facts = [
            'account.name' => $snapshot->name,
            'account.fractal_level' => $snapshot->fractalLevel ?? 0,
            'account.daily_ap' => $snapshot->dailyAp ?? 0,
            'account.wvw_rank' => $snapshot->wvwRank ?? 0,
            'account.characters' => count($snapshot->characters),
            'account.distinct_items' => count($snapshot->owned),

            'mastery.unspent_total' => $snapshot->unspentMasteryPoints(),
            'mastery.regions_played' => count(array_filter(
                $snapshot->masteryRegions,
                fn (RegionMastery $r) => $r->earned > 0
            )),

            'achievements.nearly_done' => count($snapshot->nearlyDone),
            'achievements.one_step_away' => count(array_filter(
                $snapshot->nearlyDone,
                fn (EasyWin $w) => $w->remaining() === 1
            )),

            'raids.cleared_this_week' => count($snapshot->raidsThisWeek),
            'bosses.killed_today' => count($snapshot->bossesToday),
        ];

        /*
         * Per-region unspent points, keyed by the region name exactly as the
         * mastery endpoint spells it. A single account total is not enough to
         * advise on: points are earned and spent per region and do not move
         * between them, so "you have 35 unspent" is useless if all of them sit
         * in a region whose tracks are finished.
         */
        foreach ($snapshot->masteryRegions as $region) {
            $facts["mastery.unspent.{$region->region}"] = $region->unspent();
            $facts["mastery.earned.{$region->region}"] = $region->earned;
        }

        // Booleans rather than a list, so a rule can ask `expansion.PathOfFire`
        // without needing an `in` operator.
        foreach ($snapshot->expansions as $expansion) {
            $facts["expansion.{$expansion}"] = true;
        }

        if ($character) {
            $facts += [
                'character.name' => $character->name,
                'character.profession' => $character->profession ?? '',
                'character.level' => $character->level,
                'character.agony_resistance' => $character->agonyResistance,
                'character.agony_shortfall' => $character->agonyShortfall(),
                'character.ascended_core' => $character->ascendedSlots,
                'character.ascended_missing' => count($character->slotsBelowAscended()),
                'character.empty_core_slots' => count($character->emptySlots()),
                'character.ascended_weapons' => $character->ascendedWeapons,
                'character.crafting_disciplines' => count($character->craftingDisciplines),
            ];
        }

        if ($vault = $snapshot->vault) {
            $facts += [
                'vault.open_objectives' => count($vault->open()),
                'vault.unclaimed_acclaim' => $vault->unclaimedAcclaim(),
                'vault.daily_meta_done' => $vault->dailyMetaTarget > 0
                    && $vault->dailyMetaProgress >= $vault->dailyMetaTarget,
                'vault.weekly_meta_done' => $vault->weeklyMetaTarget > 0
                    && $vault->weeklyMetaProgress >= $vault->weeklyMetaTarget,
            ];
        } else {
            /*
             * Absent is not zero.
             *
             * A key without the progression scope never read the vault at all,
             * and a rule saying "you have objectives left" would be inventing
             * that. Null fails every comparison below, which is the right
             * answer: we do not know.
             */
            $facts += [
                'vault.open_objectives' => null,
                'vault.unclaimed_acclaim' => null,
                'vault.daily_meta_done' => null,
                'vault.weekly_meta_done' => null,
            ];
        }

        return $facts;
    }

    /**
     * Does every condition hold?
     *
     * A missing or null fact fails, never passes. The alternative — treating
     * unknown as zero — is how an account whose key cannot read inventories gets
     * told it owns nothing.
     *
     * @param  array<int, array<string, mixed>>|null  $requires
     * @param  array<string, int|float|bool|string|null>  $facts
     */
    public static function satisfied(?array $requires, array $facts): bool
    {
        foreach ($requires ?? [] as $condition) {
            $path = $condition['path'] ?? null;

            if ($path === null || ! array_key_exists($path, $facts) || $facts[$path] === null) {
                return false;
            }

            if (! self::compare($facts[$path], $condition['op'] ?? '>=', $condition['value'] ?? null)) {
                return false;
            }
        }

        return true;
    }

    private static function compare(mixed $actual, string $op, mixed $expected): bool
    {
        return match ($op) {
            '>=' => $actual >= $expected,
            '>' => $actual > $expected,
            '<=' => $actual <= $expected,
            '<' => $actual < $expected,
            '==' => $actual == $expected,
            '!=' => $actual != $expected,
            // An unknown operator is an editing mistake, and the safe reading of
            // a mistake is that the rule does not fire.
            default => false,
        };
    }
}
