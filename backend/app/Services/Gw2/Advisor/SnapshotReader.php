<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * Build a Snapshot out of our own tables.
 *
 * Reads only. Nothing here calls ArenaNet, which is the point: a dashboard that
 * touched the API would spend the whole site's per-IP budget on whoever happened
 * to open it. Everything below came out of a queued sync hours ago.
 *
 * Two joins into the catalogue do the work a raw account read cannot. Agony
 * Resistance is only knowable by looking each worn infusion up in `gw2_items`
 * and reading its `AgonyResistance` modifier; an achievement is only nameable by
 * looking it up in `gw2_achievements`. Both would be hundreds of extra API
 * requests per page view if the catalogue were not mirrored locally.
 */
class SnapshotReader
{
    /**
     * Ratio above which a part-done achievement is worth mentioning.
     *
     * The test account has 443 part-done achievements. At 0.8 that list becomes
     * short enough to read; below it, "easy wins" is just the achievement panel
     * again, which the game already has and does better.
     */
    private const NEARLY_DONE = 0.8;

    /** Don't list something as nearly done when nothing has been started. */
    private const MIN_PROGRESS = 1;

    public function for(int $gw2AccountId): ?Snapshot
    {
        $account = DB::table('gw2_accounts')->where('id', $gw2AccountId)->first();

        if (! $account) {
            return null;
        }

        $state = DB::table('gw2_account_state')->where('gw2_account_id', $gw2AccountId)->first();

        $masteryPoints = $this->json($state->mastery_points ?? null);
        $regions = $this->regions($masteryPoints);

        return new Snapshot(
            accountId: $gw2AccountId,
            name: (string) ($account->name ?? ''),
            fractalLevel: $account->fractal_level !== null ? (int) $account->fractal_level : null,
            dailyAp: $account->daily_ap !== null ? (int) $account->daily_ap : null,
            wvwRank: $account->wvw_rank !== null ? (int) $account->wvw_rank : null,
            expansions: $this->expansions($account, $regions),
            masteryRegions: $regions,
            masteryLevels: $this->masteryLevels($state),
            masteryTracks: $this->masteryTracks($state),
            nearlyDone: $this->nearlyDone($state),
            characters: $this->characters($gw2AccountId),
            wallet: $this->wallet($state),
            owned: $this->owned($gw2AccountId),
            raidsThisWeek: array_values($this->json($state->raids ?? null)),
            bossesToday: array_values($this->json($state->world_bosses ?? null)),
            dungeonPathsToday: array_values($this->json($state->dungeons ?? null)),
            vault: $this->vault($state),
            featuredCharacter: $account->featured_character ?? null,
            observedAt: $state->observed_at ?? null,
            lastFullSyncAt: $account->last_full_sync_at ?? null,
        );
    }

    /**
     * What the account can actually reach, which is not what `access` says.
     *
     * The test account answered `PathOfFire` and not `HeartOfThorns` while
     * holding 40 earned Heart of Thorns mastery points — points that cannot be
     * earned in content the account cannot enter. So `access` names the product
     * that was bought, and since ArenaNet bundled the two expansions that is not
     * the same list as the content unlocked.
     *
     * Rather than encode ArenaNet's product rules, which are theirs to change,
     * this takes `access` as a floor and adds any region the account has
     * demonstrably played. Evidence beats a field, and this needs no updating
     * the next time two expansions are bundled.
     *
     * @param  array<string, RegionMastery>  $regions
     * @return array<int, string>
     */
    private function expansions(object $account, array $regions): array
    {
        $reachable = $this->json($account->access ?? null);

        // Region names as the mastery endpoint spells them, mapped to the names
        // `access` uses. Central Tyria is the base game and needs no expansion.
        $byRegion = [
            'Heart of Thorns' => 'HeartOfThorns',
            'Path of Fire' => 'PathOfFire',
            'Icebrood Saga' => 'IcebroodSaga',
            'End of Dragons' => 'EndOfDragons',
            'Secrets of the Obscure' => 'SecretsOfTheObscure',
            'Janthir Wilds' => 'JanthirWilds',
        ];

        foreach ($byRegion as $region => $expansion) {
            if (($regions[$region]->earned ?? 0) > 0 && ! in_array($expansion, $reachable, true)) {
                $reachable[] = $expansion;
            }
        }

        return array_values(array_unique($reachable));
    }

    /**
     * @param  array<string, mixed>  $masteryPoints
     * @return array<string, RegionMastery>
     */
    private function regions(array $masteryPoints): array
    {
        $out = [];

        foreach ($masteryPoints['totals'] ?? [] as $total) {
            if (! isset($total['region'])) {
                continue;
            }

            $out[$total['region']] = new RegionMastery(
                region: $total['region'],
                earned: (int) ($total['earned'] ?? 0),
                spent: (int) ($total['spent'] ?? 0),
            );
        }

        return $out;
    }

    /** @return array<int, int> */
    private function masteryLevels(?object $state): array
    {
        $levels = [];

        foreach ($this->json($state->masteries ?? null) as $track) {
            if (isset($track['id'])) {
                // level 0 is a real answer — the track is unlocked and untrained.
                $levels[(int) $track['id']] = (int) ($track['level'] ?? 0);
            }
        }

        return $levels;
    }

    /**
     * Every mastery track in the catalogue, with the account's place in it.
     *
     * The whole catalogue, not only the tracks the account has touched: a track
     * with nothing paid for is absent from the account's response entirely, and
     * those are exactly the ones worth recommending. Forty rows, so reading all
     * of them costs nothing.
     *
     * @return array<int, MasteryTrack>
     */
    private function masteryTracks(?object $state): array
    {
        $paid = [];

        foreach ($this->json($state->masteries ?? null) as $entry) {
            if (isset($entry['id'])) {
                // level is a zero-based index of the highest completed tier, so
                // the account has paid for level + 1. See MasteryRegions.
                $paid[(int) $entry['id']] = MasteryRegions::tiersPaid((int) ($entry['level'] ?? 0));
            }
        }

        return DB::table('gw2_masteries')
            ->orderBy('region')
            ->orderBy('order')
            ->get(['id', 'name', 'requirement', 'region', 'levels'])
            ->map(function ($row) use ($paid) {
                $levels = $this->json($row->levels);

                return new MasteryTrack(
                    id: (int) $row->id,
                    name: (string) $row->name,
                    requirement: $row->requirement,
                    catalogueRegion: $row->region,
                    region: MasteryRegions::toAccountName($row->region),
                    tierCosts: array_map(fn ($l) => (int) ($l['point_cost'] ?? 0), $levels),
                    tierNames: array_map(fn ($l) => (string) ($l['name'] ?? ''), $levels),
                    tiersPaid: min($paid[(int) $row->id] ?? 0, count($levels)),
                );
            })
            ->all();
    }

    /**
     * Part-done achievements, named from the catalogue.
     *
     * `advisor_eligible` is TechPlay's own curation and is respected where it has
     * been set: an achievement reviewed and marked out stays out. Nothing is
     * hidden for merely being unreviewed, because that would show an empty list
     * until somebody had gone through eight thousand rows.
     *
     * @return array<int, EasyWin>
     */
    private function nearlyDone(?object $state): array
    {
        $rows = $this->json($state->achievements ?? null);

        $candidates = [];

        foreach ($rows as $row) {
            $max = (int) ($row['max'] ?? 0);
            $current = (int) ($row['current'] ?? 0);

            if (($row['done'] ?? false) || $max <= 0 || $current < self::MIN_PROGRESS) {
                continue;
            }

            if ($current / $max >= self::NEARLY_DONE) {
                $candidates[(int) $row['id']] = ['current' => $current, 'max' => $max];
            }
        }

        if ($candidates === []) {
            return [];
        }

        $catalogue = DB::table('gw2_achievements')
            ->whereIn('id', array_keys($candidates))
            ->get(['id', 'name', 'requirement', 'advisor_eligible', 'effort_band', 'reviewed_at'])
            ->keyBy('id');

        $wins = [];

        foreach ($candidates as $id => $progress) {
            $meta = $catalogue[$id] ?? null;

            if ($meta && $meta->reviewed_at && ! $meta->advisor_eligible) {
                continue;
            }

            $wins[] = new EasyWin(
                id: $id,
                name: $meta->name ?? null,
                requirement: $meta->requirement ?? null,
                current: $progress['current'],
                max: $progress['max'],
                effortBand: $meta->effort_band ?? null,
                curated: (bool) ($meta->reviewed_at ?? false),
            );
        }

        // Closest to done first — that is the whole reason somebody reads this.
        usort($wins, fn (EasyWin $a, EasyWin $b) => [$a->remaining(), -$a->ratio()] <=> [$b->remaining(), -$b->ratio()]);

        return $wins;
    }

    /** @return array<int, CharacterView> */
    private function characters(int $gw2AccountId): array
    {
        $rows = DB::table('gw2_characters')->where('gw2_account_id', $gw2AccountId)->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $equipment = $rows->map(fn ($r) => $this->json($r->equipment));

        $itemIds = $equipment->flatten(1)
            ->flatMap(fn ($piece) => [...(array) ($piece['id'] ?? []), ...($piece['infusions'] ?? [])])
            ->filter()
            ->unique()
            ->values()
            ->all();

        $items = $itemIds === []
            ? collect()
            : DB::table('gw2_items')->whereIn('id', $itemIds)->get(['id', 'rarity', 'details'])->keyBy('id');

        return $rows->values()->map(function ($row, $i) use ($equipment, $items) {
            $worn = $equipment[$i];

            $rarity = [];
            $agony = 0;
            $ascendedWeapons = 0;
            $weaponSlots = 0;

            foreach ($worn as $piece) {
                $slot = $piece['slot'] ?? null;
                $item = isset($piece['id']) ? ($items[$piece['id']] ?? null) : null;

                if ($slot !== null && in_array($slot, CharacterView::CORE_SLOTS, true) && $item) {
                    $rarity[$slot] = (string) $item->rarity;
                }

                // Land weapons only. Aquatic slots and gathering tools are in
                // this same array and belong to neither count.
                if ($slot !== null && preg_match('/^Weapon[AB][12]$/', $slot) && $item) {
                    $weaponSlots++;

                    if (in_array($item->rarity, ['Ascended', 'Legendary'], true)) {
                        $ascendedWeapons++;
                    }
                }

                foreach ($piece['infusions'] ?? [] as $infusionId) {
                    $agony += $this->agonyOf($items[$infusionId] ?? null);
                }
            }

            $ascended = count(array_filter($rarity, fn ($r) => in_array($r, ['Ascended', 'Legendary'], true)));

            return new CharacterView(
                name: (string) $row->name,
                profession: $row->profession,
                race: $row->race,
                level: (int) $row->level,
                agonyResistance: $agony,
                ascendedSlots: $ascended,
                coreSlots: count(CharacterView::CORE_SLOTS),
                slotRarity: $rarity,
                ascendedWeapons: $ascendedWeapons,
                weaponSlots: $weaponSlots,
                craftingDisciplines: $this->disciplines($row->crafting),
                deaths: $row->deaths !== null ? (int) $row->deaths : null,
            );
        })->all();
    }

    /**
     * Agony Resistance one infusion contributes.
     *
     * Read out of the catalogue rather than guessed from the item name. An item
     * called "+10 Agony Infusion" really does carry a modifier of 10, but names
     * are not a contract and a stat infusion with an agony line would be missed
     * entirely by a name match.
     */
    private function agonyOf(?object $item): int
    {
        foreach (($this->json($item->details ?? null)['infix_upgrade']['attributes'] ?? []) as $attribute) {
            if (($attribute['attribute'] ?? null) === 'AgonyResistance') {
                return (int) ($attribute['modifier'] ?? 0);
            }
        }

        return 0;
    }

    /** @return array<int, string> */
    private function disciplines(?string $crafting): array
    {
        return array_values(array_filter(array_map(
            fn ($d) => ($d['active'] ?? false) ? ($d['discipline'] ?? null) : null,
            $this->json($crafting)
        )));
    }

    /** @return array<int, int> */
    private function wallet(?object $state): array
    {
        $wallet = [];

        foreach ($this->json($state->wallet ?? null) as $entry) {
            if (isset($entry['id'])) {
                $wallet[(int) $entry['id']] = (int) ($entry['value'] ?? 0);
            }
        }

        return $wallet;
    }

    /**
     * Everything the account holds, summed across every location.
     *
     * The ledger deliberately keeps one row per place, because "where is it" is
     * a real question. This is the other question — "do I have enough" — and it
     * has to add the bank to the bags to material storage, or a planner tells
     * somebody to buy what is sitting in their bank.
     *
     * @return array<int, int>
     */
    private function owned(int $gw2AccountId): array
    {
        return DB::table('gw2_item_ledger')
            ->where('gw2_account_id', $gw2AccountId)
            ->groupBy('item_id')
            ->selectRaw('item_id, sum(quantity) as held')
            ->pluck('held', 'item_id')
            ->map(fn ($q) => (int) $q)
            ->all();
    }

    private function vault(?object $state): ?VaultView
    {
        $vault = $this->json($state->wizards_vault ?? null);

        if ($vault === []) {
            return null;
        }

        return new VaultView(
            daily: $this->objectives($vault['daily'] ?? [], 'daily'),
            weekly: $this->objectives($vault['weekly'] ?? [], 'weekly'),
            dailyMetaClaimed: (bool) ($vault['daily']['meta_reward_claimed'] ?? false),
            weeklyMetaClaimed: (bool) ($vault['weekly']['meta_reward_claimed'] ?? false),
            dailyMetaProgress: (int) ($vault['daily']['meta_progress_current'] ?? 0),
            dailyMetaTarget: (int) ($vault['daily']['meta_progress_complete'] ?? 0),
            weeklyMetaProgress: (int) ($vault['weekly']['meta_progress_current'] ?? 0),
            weeklyMetaTarget: (int) ($vault['weekly']['meta_progress_complete'] ?? 0),
        );
    }

    /**
     * @param  array<string, mixed>  $period
     * @return array<int, VaultObjective>
     */
    private function objectives(array $period, string $which): array
    {
        return array_values(array_map(fn ($o) => new VaultObjective(
            id: (int) ($o['id'] ?? 0),
            title: (string) ($o['title'] ?? ''),
            track: (string) ($o['track'] ?? ''),
            acclaim: (int) ($o['acclaim'] ?? 0),
            claimed: (bool) ($o['claimed'] ?? false),
            current: (int) ($o['progress_current'] ?? 0),
            target: (int) ($o['progress_complete'] ?? 0),
            period: $which,
        ), $period['objectives'] ?? []));
    }

    /** @return array<mixed> */
    private function json(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
