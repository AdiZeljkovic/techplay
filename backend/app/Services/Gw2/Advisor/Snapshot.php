<?php

namespace App\Services\Gw2\Advisor;

/**
 * One account, normalised, as everything downstream sees it.
 *
 * This exists so no rule and no card reads a raw API shape. Those shapes are
 * inconsistent in ways that have already cost time — `specializations` is an
 * object keyed by game mode while `equipment` beside it is a list, and `access`
 * names the product bought rather than the content reachable. Deciding all of
 * that once, here, is cheaper than deciding it in fifteen places.
 *
 * Deliberately a plain readonly object rather than an Eloquent model: nothing in
 * it is stored, it is derived on read from tables the sync fills, and making it
 * a model would invite somebody to save it.
 */
readonly class Snapshot
{
    /**
     * @param  array<int, string>  $expansions  Content the account can actually reach.
     * @param  array<string, RegionMastery>  $masteryRegions  Keyed by region name.
     * @param  array<int, int>  $masteryLevels  Mastery track id => level reached.
     * @param  array<int, EasyWin>  $nearlyDone  Achievements close to finished.
     * @param  array<int, CharacterView>  $characters
     * @param  array<int, int>  $wallet  Currency id => amount.
     * @param  array<int, int>  $owned  Item id => how many, everywhere combined.
     * @param  array<int, string>  $raidsThisWeek  Encounter ids cleared since the weekly reset.
     * @param  array<int, string>  $bossesToday  World boss ids killed since the daily reset.
     */
    public function __construct(
        public int $accountId,
        public string $name,
        public ?int $fractalLevel,
        public ?int $dailyAp,
        public ?int $wvwRank,
        public array $expansions,
        public array $masteryRegions,
        public array $masteryLevels,
        public array $nearlyDone,
        public array $characters,
        public array $wallet,
        public array $owned,
        public array $raidsThisWeek,
        public array $bossesToday,
        public ?VaultView $vault,
        public ?string $observedAt,
        public ?string $lastFullSyncAt,
    ) {}

    /** Mastery points earned but not spent, across every region. */
    public function unspentMasteryPoints(): int
    {
        return array_sum(array_map(fn (RegionMastery $r) => $r->unspent(), $this->masteryRegions));
    }

    /**
     * The character an advisor should talk about.
     *
     * Highest level first, then the best geared — a level 80 in exotics is a
     * more useful subject than a level 12 that was made yesterday. Nothing here
     * asks the player which character is "main" because nothing in the API says
     * so; when that matters it becomes a setting rather than a guess.
     */
    public function primaryCharacter(): ?CharacterView
    {
        $ranked = $this->characters;

        usort($ranked, fn (CharacterView $a, CharacterView $b) => [$b->level, $b->ascendedSlots] <=> [$a->level, $a->ascendedSlots]);

        return $ranked[0] ?? null;
    }

    public function canReach(string $expansion): bool
    {
        return in_array($expansion, $this->expansions, true);
    }

    public function has(int $itemId, int $atLeast = 1): bool
    {
        return ($this->owned[$itemId] ?? 0) >= $atLeast;
    }

    public function currency(int $id): int
    {
        return $this->wallet[$id] ?? 0;
    }
}
