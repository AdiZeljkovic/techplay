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
     * @param  array<int, MasteryTrack>  $masteryTracks  Every track in the catalogue.
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
        public array $masteryTracks,
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
     * Tracks in one region, by the name the account endpoint uses.
     *
     * @return array<int, MasteryTrack>
     */
    public function tracksIn(string $region): array
    {
        return array_values(array_filter($this->masteryTracks, fn (MasteryTrack $t) => $t->region === $region));
    }

    /**
     * What the account could buy right now in a region, cheapest tier first.
     *
     * Affordability is per region because points are region-locked, and it is per
     * tier because the costs climb steeply — sixteen Heart of Thorns points buys
     * the next tier of four tracks or most of one, and only the tier cost says
     * which.
     *
     * @return array<int, MasteryTrack>
     */
    public function affordableIn(string $region): array
    {
        // A region the account has never entered is absent from the points
        // endpoint entirely, so this is a real case and not defensive padding.
        $budget = ($this->masteryRegions[$region] ?? null)?->unspent() ?? 0;

        $affordable = array_filter(
            $this->tracksIn($region),
            fn (MasteryTrack $t) => ! $t->finished() && $t->nextTierCost() !== null && $t->nextTierCost() <= $budget
        );

        usort($affordable, fn (MasteryTrack $a, MasteryTrack $b) => $a->nextTierCost() <=> $b->nextTierCost());

        return $affordable;
    }

    /**
     * Point costs the account has already paid in a region.
     *
     * The figure the arithmetic test reconciles against what the account itself
     * reports as spent. It is also the honest denominator for a progress bar:
     * the mockup's "186 / 254 Mastery Points" is this, summed from the catalogue,
     * rather than a number nothing computes.
     */
    public function pointsSpentIn(string $region): int
    {
        return array_sum(array_map(fn (MasteryTrack $t) => $t->pointsSpent(), $this->tracksIn($region)));
    }

    public function pointsTotalIn(string $region): int
    {
        return array_sum(array_map(fn (MasteryTrack $t) => $t->pointsTotal(), $this->tracksIn($region)));
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
