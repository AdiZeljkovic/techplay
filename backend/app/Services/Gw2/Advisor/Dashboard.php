<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Everything one dashboard render needs, in one payload.
 *
 * Built here rather than in the controller because the frontend must not know
 * anything about progression. Next draws cards out of this structure; every
 * decision about what a card means — which slots count as ascended, which
 * expansions the account can reach, how much Agony Resistance the worn set adds
 * up to — was already made in the snapshot layer. That is what lets the same
 * payload later serve the mobile app and the Discord bot without any of them
 * re-deriving it and disagreeing.
 *
 * **No summary score.** The mockup draws "Weekly Completion Score 72/100" and
 * nothing computes that number. A single figure over five unrelated domains would
 * have to invent both the weights and the denominator, so the cards report their
 * own state and the reader does their own weighing.
 */
class Dashboard
{
    /**
     * Cached against the sync that produced it.
     *
     * The key carries `observed_at`, so a fresh sync invalidates this by writing a
     * different key rather than by anybody remembering to forget the old one. An
     * hour is generous on purpose: nothing here can change without a sync, and a
     * sync rewrites the key.
     */
    private const TTL_SECONDS = 3600;

    public function __construct(
        private readonly SnapshotReader $reader,
        private readonly Advisor $advisor,
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function for(int $gw2AccountId, ?Intent $intent = null): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        /*
         * Only the unfiltered view is cached. An intent is a question the player
         * just asked — a time budget, a domain to avoid — and caching those would
         * mean either a key per combination or a stale answer to a fresh
         * question. Neither is worth it: the underlying read is a handful of
         * indexed queries.
         */
        if ($intent === null || ($intent->minutes === null && $intent->avoid === [] && $intent->goal === null)) {
            return Cache::remember(
                $this->key($snapshot),
                self::TTL_SECONDS,
                fn () => $this->build($snapshot, new Intent)
            );
        }

        return $this->build($snapshot, $intent);
    }

    private function key(Snapshot $snapshot): string
    {
        // Spelled once. Three places spelling an article cache key by hand is how
        // edits stopped reaching readers for an hour in August.
        return "gw2:dashboard:{$snapshot->accountId}:".($snapshot->observedAt ?? 'never');
    }

    /**
     * @return array<string, mixed>
     */
    private function build(Snapshot $snapshot, Intent $intent): array
    {
        return [
            'account' => $this->account($snapshot),
            'cards' => [
                'masteries' => $this->masteryCard($snapshot),
                'gear' => $this->gearCard($snapshot),
                'fractals' => $this->fractalCard($snapshot),
                'achievements' => $this->achievementCard($snapshot),
                'vault' => $this->vaultCard($snapshot),
            ],
            'advice' => $this->advisor->advise($snapshot, $intent),
            'since_last_sync' => $this->delta($snapshot),
        ];
    }

    /** @return array<string, mixed> */
    private function account(Snapshot $snapshot): array
    {
        $character = $snapshot->primaryCharacter();

        return [
            'name' => $snapshot->name,
            'fractal_level' => $snapshot->fractalLevel,
            'daily_ap' => $snapshot->dailyAp,
            'wvw_rank' => $snapshot->wvwRank,
            'characters' => count($snapshot->characters),
            'expansions' => $snapshot->expansions,
            'observed_at' => $snapshot->observedAt,
            'last_full_sync_at' => $snapshot->lastFullSyncAt,
            'featured_character' => $character ? [
                'name' => $character->name,
                'profession' => $character->profession,
                'race' => $character->race,
                'level' => $character->level,
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function masteryCard(Snapshot $snapshot): array
    {
        $regions = [];

        foreach ($snapshot->masteryRegions as $region) {
            // Regions with nothing earned are content the account has not
            // entered. Drawing seven empty bars says less than drawing four real
            // ones.
            if ($region->earned === 0) {
                continue;
            }

            $tracks = $snapshot->tracksIn($region->region);
            $pointsTotal = $snapshot->pointsTotalIn($region->region);
            $pointsSpent = $snapshot->pointsSpentIn($region->region);

            $regions[] = [
                'region' => $region->region,
                'earned' => $region->earned,
                'spent' => $region->spent,
                'unspent' => $region->unspent(),
                /*
                 * A real denominator, summed from the catalogue's per-tier point
                 * costs. The mockup draws "186 / 254 Mastery Points" beside a
                 * percentage; this is that figure, computed rather than chosen,
                 * and it reconciles against what the account itself reports as
                 * spent — see Gw2MasteryArithmeticTest.
                 */
                'points_spent' => $pointsSpent,
                'points_total' => $pointsTotal,
                'percent' => $pointsTotal > 0 ? (int) round($pointsSpent / $pointsTotal * 100) : 0,
                'tracks_finished' => count(array_filter($tracks, fn (MasteryTrack $t) => $t->finished())),
                'tracks' => count($tracks),
                // Cheapest first: the one that leaves the most over.
                'affordable' => array_map(fn (MasteryTrack $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'tier' => $t->nextTierName(),
                    'buying_tier' => $t->tiersPaid + 1,
                    'tiers' => $t->tiers(),
                    'cost' => $t->nextTierCost(),
                    'points_remaining' => $t->pointsRemaining(),
                ], array_slice($snapshot->affordableIn($region->region), 0, 4)),
            ];
        }

        usort($regions, fn ($a, $b) => $b['unspent'] <=> $a['unspent']);

        return [
            'unspent_total' => $snapshot->unspentMasteryPoints(),
            'regions' => $regions,
            /*
             * Tracks the account has paid at least one tier of.
             *
             * It used to count tracks with `level > 0`, which was wrong twice
             * over: `level` is a zero-based index, so a track at level 0 has its
             * first tier paid for, and a track with nothing paid for is absent
             * from the response rather than sitting there at zero.
             */
            'tracks_started' => count(array_filter($snapshot->masteryTracks, fn (MasteryTrack $t) => $t->tiersPaid > 0)),
            'tracks_finished' => count(array_filter($snapshot->masteryTracks, fn (MasteryTrack $t) => $t->finished())),
            'tracks_total' => count(array_filter($snapshot->masteryTracks, fn (MasteryTrack $t) => $t->region !== null)),
        ];
    }

    /** @return array<string, mixed>|null */
    private function gearCard(Snapshot $snapshot): ?array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return null;
        }

        return [
            'character' => $character->name,
            'ascended_core' => $character->ascendedSlots,
            'core_slots' => $character->coreSlots,
            'below_ascended' => $character->slotsBelowAscended(),
            'empty' => $character->emptySlots(),
            'ascended_weapons' => $character->ascendedWeapons,
            'weapon_slots' => $character->weaponSlots,
            // Slot by slot, because a set at 9/12 says nothing about which three.
            'slots' => $character->slotRarity,
            'crafting' => $character->craftingDisciplines,
        ];
    }

    /** @return array<string, mixed>|null */
    private function fractalCard(Snapshot $snapshot): ?array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return null;
        }

        return [
            'personal_level' => $snapshot->fractalLevel,
            'agony_resistance' => $character->agonyResistance,
            'tier_4_target' => CharacterView::TIER_4_AGONY,
            'shortfall' => $character->agonyShortfall(),
            /*
             * One threshold, named as a target rather than a gate, and no
             * per-scale table. Those numbers are not in the API, are not in our
             * catalogue, and would be the tool's first invented figure.
             */
            'tiers_modelled' => false,
        ];
    }

    /** @return array<string, mixed> */
    private function achievementCard(Snapshot $snapshot): array
    {
        return [
            'nearly_done' => count($snapshot->nearlyDone),
            'one_step_away' => count(array_filter($snapshot->nearlyDone, fn (EasyWin $w) => $w->remaining() === 1)),
            'daily_ap' => $snapshot->dailyAp,
            'closest' => array_map(fn (EasyWin $w) => [
                'id' => $w->id,
                'name' => $w->name,
                'requirement' => $w->requirement,
                'current' => $w->current,
                'max' => $w->max,
                'remaining' => $w->remaining(),
                // Says plainly whether a human has looked at this row. Some
                // achievements are seasonal or retired and the API does not say
                // which.
                'reviewed' => $w->curated,
                'effort' => $w->effortBand,
            ], array_slice($snapshot->nearlyDone, 0, 8)),
        ];
    }

    /** @return array<string, mixed>|null */
    private function vaultCard(Snapshot $snapshot): ?array
    {
        if (! $snapshot->vault) {
            // Absent, not empty — the key is missing the progression scope. The
            // UI needs to be able to tell those apart.
            return null;
        }

        $vault = $snapshot->vault;

        return [
            'daily' => [
                'progress' => $vault->dailyMetaProgress,
                'target' => $vault->dailyMetaTarget,
                'claimed' => $vault->dailyMetaClaimed,
            ],
            'weekly' => [
                'progress' => $vault->weeklyMetaProgress,
                'target' => $vault->weeklyMetaTarget,
                'claimed' => $vault->weeklyMetaClaimed,
            ],
            'unclaimed_acclaim' => $vault->unclaimedAcclaim(),
            'open' => array_map(fn (VaultObjective $o) => [
                'id' => $o->id,
                'title' => $o->title,
                'period' => $o->period,
                'track' => $o->track,
                'acclaim' => $o->acclaim,
                'current' => $o->current,
                'target' => $o->target,
            ], $vault->open()),
        ];
    }

    /**
     * What moved since the read before this one.
     *
     * This is the only place a player can see their own history, because the API
     * has none: /v2/account/raids reports the current week and nothing anywhere
     * reports a lifetime. These rows are the difference between two of our reads
     * and exist for no other reason.
     *
     * @return array<string, mixed>
     */
    private function delta(Snapshot $snapshot): array
    {
        $events = DB::table('gw2_progress_events')
            ->where('gw2_account_id', $snapshot->accountId)
            ->orderByDesc('occurred_at')
            ->limit(20)
            ->get(['type', 'payload', 'occurred_at']);

        $ids = $events
            ->filter(fn ($e) => $e->type === 'achievement_completed')
            ->map(fn ($e) => json_decode($e->payload, true)['id'] ?? null)
            ->filter()
            ->all();

        $names = $ids === []
            ? collect()
            : DB::table('gw2_achievements')->whereIn('id', $ids)->pluck('name', 'id');

        return [
            'events' => $events->map(fn ($e) => [
                'type' => $e->type,
                'id' => json_decode($e->payload, true)['id'] ?? null,
                // Named where we can. An id on its own is not a thing anybody
                // recognises as their own progress.
                'name' => $names[json_decode($e->payload, true)['id'] ?? 0] ?? null,
                'occurred_at' => $e->occurred_at,
            ])->all(),
            'tracked_since' => DB::table('gw2_accounts')->where('id', $snapshot->accountId)->value('created_at'),
        ];
    }
}
