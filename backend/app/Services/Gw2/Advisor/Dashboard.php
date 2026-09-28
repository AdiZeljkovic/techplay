<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

    /**
     * Bumped whenever the shape of this payload changes.
     *
     * The key below carries `observed_at`, which answers "has the account
     * changed" and not "has the *answer* changed". Ship a payload with a new
     * field in it and every connected player keeps the old shape for an hour,
     * with a deploy that reports success and a page that quietly renders
     * nothing new — which is exactly what happened the first time the icons
     * went out.
     *
     * The public pages carry the same constant for the same reason. Change the
     * shape, change this number, in the same commit.
     */
    private const PAYLOAD_VERSION = 2;

    public function __construct(
        private readonly SnapshotReader $reader,
        private readonly Advisor $advisor,
        private readonly PlayerChoices $choices,
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
        /*
         * The pin is part of the answer, so it is part of the key. Without it a
         * player who pins a goal keeps being served the cached advice from
         * before they picked one.
         */
        $pin = $this->choices->defaultGoal($snapshot->accountId) ?? 'none';

        return 'gw2:dashboard:v'.self::PAYLOAD_VERSION
            .":{$snapshot->accountId}:{$pin}:".($snapshot->observedAt ?? 'never');
    }

    /**
     * @return array<string, mixed>
     */
    private function build(Snapshot $snapshot, Intent $intent): array
    {
        /*
         * A pin is the goal the player already told us about. Falling back to
         * it is the whole reason pinning exists — §21 wants somebody to return
         * and see the next blocker, not to re-state their goal every visit.
         */
        $pins = $this->choices->pins($snapshot->accountId);

        if ($intent->goal === null && $pins !== []) {
            $intent = new Intent(
                goal: $pins[0]['slug'],
                minutes: $intent->minutes,
                avoid: $intent->avoid,
            );
        }

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
            'pins' => $pins,
            'goal_in_use' => $intent->goal,
            /*
             * The questions the API cannot answer, with whatever the player has
             * already said. §17.3 makes unknown a first-class state, and a
             * first-class state needs somewhere to be resolved.
             */
            'open_questions' => $this->choices->openQuestions($snapshot),
            'characters' => array_map(fn (CharacterView $c) => [
                'name' => $c->name,
                'profession' => $c->profession,
                'level' => $c->level,
                'ascended_core' => $c->ascendedSlots,
            ], $snapshot->characters),
            'featured_character' => $snapshot->featuredCharacter,
        ];
    }

    /**
     * Every mastery track, grouped by region.
     *
     * Its own call rather than part of the dashboard: forty tracks with their
     * tier names is a few kilobytes that the front page does not need, and the
     * masteries page is the only thing that reads it.
     *
     * @return array<string, mixed>|null
     */
    public function masteries(int $gw2AccountId): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        $regions = [];

        foreach ($snapshot->masteryRegions as $region) {
            $tracks = $snapshot->tracksIn($region->region);

            if ($tracks === []) {
                continue;
            }

            $total = $snapshot->pointsTotalIn($region->region);
            $spent = $snapshot->pointsSpentIn($region->region);

            $regions[] = [
                'region' => $region->region,
                'earned' => $region->earned,
                'spent' => $region->spent,
                'unspent' => $region->unspent(),
                'points_spent' => $spent,
                'points_total' => $total,
                'percent' => $total > 0 ? (int) round($spent / $total * 100) : 0,
                'tracks' => array_map(fn (MasteryTrack $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'requirement' => $t->requirement,
                    'tiers_paid' => $t->tiersPaid,
                    'tiers' => $t->tiers(),
                    'tier_costs' => $t->tierCosts,
                    'tier_names' => $t->tierNames,
                    // One picture per tier, and a scene render for the track.
                    // Both come out of /v2/masteries and neither was carried.
                    'tier_icons' => $t->tierIcons,
                    'background' => $t->background,
                    'next_tier' => $t->nextTierName(),
                    'next_cost' => $t->nextTierCost(),
                    'points_spent' => $t->pointsSpent(),
                    'points_total' => $t->pointsTotal(),
                    'points_remaining' => $t->pointsRemaining(),
                    'finished' => $t->finished(),
                    'untouched' => $t->untouched(),
                    // Whether this region's spare points reach it. The answer
                    // is what turns a list into a recommendation.
                    'affordable' => ! $t->finished()
                        && $t->nextTierCost() !== null
                        && $t->nextTierCost() <= $region->unspent(),
                ], $tracks),
            ];
        }

        usort($regions, fn ($a, $b) => $b['unspent'] <=> $a['unspent']);

        /*
         * Tracks the catalogue has but no account region claims.
         *
         * `Magic` — Castoran Survivalist and the rest — has no counterpart in
         * /v2/account/mastery/points, so pairing it would file points under the
         * wrong expansion. Shown apart, and said out loud, rather than hidden.
         */
        $unpaired = array_values(array_filter(
            $snapshot->masteryTracks,
            fn (MasteryTrack $t) => $t->region === null
        ));

        return [
            'regions' => $regions,
            'unspent_total' => $snapshot->unspentMasteryPoints(),
            'unpaired' => array_map(fn (MasteryTrack $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'catalogue_region' => $t->catalogueRegion,
                'tiers' => $t->tiers(),
                'points_total' => $t->pointsTotal(),
            ], $unpaired),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * What it takes to make one thing, given what this account holds.
     *
     * The target is named by the player rather than guessed. An ascended set
     * comes in a stat prefix and an armour weight, and nothing in the API says
     * which one somebody wants — a planner that picked for them would be
     * confidently planning the wrong set.
     *
     * @return array<string, mixed>|null
     */
    public function plan(int $gw2AccountId, int $itemId, int $quantity): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        $target = DB::table('gw2_items')->where('id', $itemId)->first(['id', 'name', 'rarity', 'type', 'icon']);

        if (! $target) {
            return null;
        }

        /*
         * Every character's disciplines, not the featured one's.
         *
         * Crafting is per character but an account is not: somebody with a
         * Tailor and an Armorsmith can make either, and asking only the
         * character the dashboard happens to feature would report a wall that
         * is not there.
         */
        $disciplines = array_values(array_unique(array_merge(
            ...array_map(fn (CharacterView $c) => $c->craftingDisciplines, $snapshot->characters)
        )));

        $tree = app(RecipeTree::class);
        $root = $tree->plan($itemId, $quantity, $snapshot->owned, $disciplines);
        $list = $tree->shoppingList($root);

        return [
            'target' => [
                'item_id' => (int) $target->id,
                'name' => $target->name,
                'rarity' => $target->rarity,
                'type' => $target->type,
                'icon' => $target->icon,
                'quantity' => $quantity,
            ],
            'craftable' => $root->craftable(),
            'already_have' => $root->owned,
            'tree' => $root->toArray(),
            /*
             * The part worth acting on. Intermediates are interesting to look at
             * and useless to shop for — nobody buys a steel ingot they are about
             * to make out of ore they already have.
             */
            'shopping_list' => array_map(fn (RecipeNode $n) => [
                'item_id' => $n->itemId,
                'name' => $n->name,
                'rarity' => $n->rarity,
                'icon' => $n->icon,
                'needed' => $n->needed,
                'owned' => $n->owned,
                'missing' => $n->missing(),
            ], $list),
            'disciplines_used' => $disciplines,
            /*
             * Whether anybody on the account can actually make this.
             *
             * The test account is a Tailor and this is Armorsmith work, which is
             * a real obstacle and the kind a materials list quietly implies is
             * not there. Named rather than left for the crafting station.
             */
            'requires' => $root->craftable() ? [
                'disciplines' => $root->disciplines,
                'min_rating' => $root->minRating,
                'have_it' => array_intersect($root->disciplines, $disciplines) !== [],
            ] : null,
            'prices' => $this->priceBuckets($list),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * An evening: a plan, the priorities behind it, and what is scheduled.
     *
     * Built entirely out of recommendations that already hold. The advisor has
     * decided what is worth doing and how sure it is; this only orders a subset
     * into something that fits the time. A planner that generated its own
     * activities would be a second advisor with no rules behind it.
     *
     * @return array<string, mixed>|null
     */
    public function tonight(int $gw2AccountId, ?int $minutes): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        $advice = $this->advisor->advise($snapshot, new Intent(minutes: $minutes));

        return [
            'plan' => app(SessionPlan::class)->build(
                [...$advice['headline'], ...$advice['alternatives']],
                $minutes
            ),
            'priorities' => $this->priorities($snapshot),
            'events' => $this->events(),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * The bars down the right of the mockup, and every one is measured.
     *
     * No invented denominators here: Agony Resistance is summed from worn
     * infusions against the one sourced threshold, the gear figure counts the
     * twelve slots that have an ascended tier, and the mastery percentage is a
     * sum over the catalogue's own point costs.
     *
     * @return array<int, array<string, mixed>>
     */
    private function priorities(Snapshot $snapshot): array
    {
        $out = [];
        $character = $snapshot->primaryCharacter();

        if ($character && $character->agonyShortfall() > 0) {
            $out[] = [
                'key' => 'agony',
                'label' => 'Agony Resistance for Tier 4',
                'current' => $character->agonyResistance,
                'target' => CharacterView::TIER_4_AGONY,
                'unit' => 'AR',
            ];
        }

        if ($character && $character->ascendedSlots < $character->coreSlots) {
            $out[] = [
                'key' => 'ascended',
                'label' => 'Ascended core slots',
                'current' => $character->ascendedSlots,
                'target' => $character->coreSlots,
                'unit' => 'slots',
            ];
        }

        foreach ($snapshot->masteryRegions as $region) {
            if ($region->unspent() < 2) {
                continue;
            }

            $total = $snapshot->pointsTotalIn($region->region);

            if ($total === 0) {
                continue;
            }

            $out[] = [
                'key' => 'mastery:'.$region->region,
                'label' => $region->region.' masteries',
                'current' => $snapshot->pointsSpentIn($region->region),
                'target' => $total,
                'unit' => 'points',
                'note' => $region->unspent().' unspent',
            ];
        }

        if ($snapshot->vault && $snapshot->vault->weeklyMetaTarget > 0) {
            $out[] = [
                'key' => 'vault_weekly',
                'label' => "Wizard's Vault, this week",
                'current' => $snapshot->vault->weeklyMetaProgress,
                'target' => $snapshot->vault->weeklyMetaTarget,
                'unit' => 'objectives',
            ];
        }

        return array_slice($out, 0, 5);
    }

    /**
     * World bosses and metas, when somebody has checked them.
     *
     * `/v2/account/worldbosses` says which ones this account killed today and
     * never when the next one spawns — there is no schedule endpoint. The times
     * are real, fixed and published, and they are external knowledge, so they
     * are rows a person enters and verifies rather than a table typed from
     * memory. Nothing unverified reaches a reader: a wrong spawn time sends
     * somebody to an empty map, which is worse than saying nothing.
     *
     * @return array<int, array<string, mixed>>
     */
    private function events(): array
    {
        if (! Schema::hasTable('gw2_events')) {
            return [];
        }

        $now = (int) now()->utc()->format('H') * 60 + (int) now()->utc()->format('i');

        return DB::table('gw2_events')
            ->where('is_published', true)
            ->whereNotNull('verified_at')
            ->get(['name', 'slug', 'kind', 'region', 'waypoint', 'daily_times_utc', 'duration_minutes', 'rewards'])
            ->map(function ($event) use ($now) {
                $times = json_decode($event->daily_times_utc ?? '[]', true) ?: [];
                $next = null;

                foreach ($times as $minute) {
                    // Wrapping past midnight is the normal case late in the
                    // evening, not an edge one.
                    $away = ((int) $minute - $now + 1440) % 1440;

                    if ($next === null || $away < $next) {
                        $next = $away;
                    }
                }

                return [
                    'name' => $event->name,
                    'slug' => $event->slug,
                    'kind' => $event->kind,
                    'region' => $event->region,
                    'waypoint' => $event->waypoint,
                    'rewards' => $event->rewards,
                    'minutes_away' => $next,
                    'live_now' => $next !== null && $event->duration_minutes
                        && $next >= 1440 - (int) $event->duration_minutes,
                ];
            })
            ->filter(fn ($e) => $e['minutes_away'] !== null)
            ->sortBy('minutes_away')
            ->take(6)
            ->values()
            ->all();
    }

    /**
     * Raids, dungeons and world bosses.
     *
     * @return array<string, mixed>|null
     */
    public function content(int $gw2AccountId): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        return app(ContentProgress::class)->for($snapshot) + [
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * What the missing materials cost, in two buckets that must not be added up.
     *
     * §13.2: *"Never collapse gold-equivalent and account-bound/time-gated
     * requirements into one misleading cost. Show separate buckets."*
     *
     * The authority on which bucket something is in is the price endpoint
     * itself — 27,997 of the catalogue's 74,265 items appear in it. An item
     * absent from it cannot be bought at any price, and counting it as zero is
     * exactly the misleading total that rule forbids.
     *
     * Both prices are reported because they answer different questions: the
     * sell price is what you pay to have it now, the buy price is what you pay
     * to wait. On 30 September a Glob of Ectoplasm was 1,690 to bid and 1,780
     * to buy outright, and a single "price" would have to pick a side silently.
     *
     * @param  array<int, RecipeNode>  $list
     * @return array<string, mixed>|null
     */
    private function priceBuckets(array $list): ?array
    {
        if ($list === []) {
            return null;
        }

        $ids = array_map(fn (RecipeNode $n) => $n->itemId, $list);
        $prices = DB::table('gw2_item_prices')->whereIn('item_id', $ids)->get()->keyBy('item_id');

        if ($prices->isEmpty()) {
            // No prices loaded at all: say nothing rather than report a total
            // of zero, which reads as "free".
            return null;
        }

        $buyNow = 0;
        $bidAndWait = 0;
        $tradable = [];
        $untradable = [];
        $observedAt = null;

        foreach ($list as $node) {
            $price = $prices[$node->itemId] ?? null;

            if (! $price || ($price->sell_unit === null && $price->buy_unit === null)) {
                $untradable[] = ['item_id' => $node->itemId, 'name' => $node->name, 'missing' => $node->missing()];

                continue;
            }

            $buyNow += (int) ($price->sell_unit ?? 0) * $node->missing();
            $bidAndWait += (int) ($price->buy_unit ?? 0) * $node->missing();

            $tradable[] = [
                'item_id' => $node->itemId,
                'name' => $node->name,
                'missing' => $node->missing(),
                'sell_unit' => $price->sell_unit,
                'buy_unit' => $price->buy_unit,
                /*
                 * Quantity, because a price without it is not a price anybody
                 * can act on. Three copper against a stock of two is not what
                 * four hundred of them will cost.
                 */
                'sell_quantity' => $price->sell_quantity,
            ];

            $observedAt = max($observedAt, $price->observed_at);
        }

        return [
            // Copper. Turning it into gold is a display decision and belongs
            // where the display is.
            'buy_now' => $buyNow,
            'bid_and_wait' => $bidAndWait,
            'tradable' => $tradable,
            /*
             * The other bucket, listed rather than summed. These come from
             * vendors, currencies, time gates and drops, and there is no
             * exchange rate between them and gold.
             */
            'not_tradable' => $untradable,
            'observed_at' => $observedAt,
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
                // Named apart from the masteries payload's `tracks`, which is the
                // list itself. One word meaning both a count and a collection is
                // how a client ends up rendering "6" where a table belongs.
                'track_count' => count($tracks),
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
            /*
             * And the piece actually worn in each — name, icon, rarity.
             *
             * `slots` stays as it was because every count is built on it. This
             * is the layer on top: a row of twelve rarities is a table, and a
             * row of twelve items somebody recognises is their character.
             */
            'items' => $character->slotItems,
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
                'icon' => $w->icon,
                // Only what is left, and only where the game named it. A list
                // of three things beats a bar at 94% every time.
                'steps_remaining' => array_values(array_filter(array_map(
                    fn ($step) => $step->text,
                    $w->remainingSteps()
                ))),
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
