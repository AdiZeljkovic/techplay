<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;
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
     *
     * 4 (28 October 2026): `progress` and `action` on recommendation details,
     * `points` and `mastery_region` on the easy wins. 5, the same day:
     * `rewards` on recommendation details. 6, the same day: `stats` and
     * `weight` on the gear card's worn pieces.
     */
    private const PAYLOAD_VERSION = 6;

    /** How long the masteries page's "best points" list runs. The rest are on the insight pages. */
    private const POINTS_TO_GET = 8;

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

        /*
         * The same goes for the other two things the player tells us. A chosen
         * character changes every gear and fractal card, and an answered
         * question changes `open_questions`; neither touches `observed_at`, so
         * without them here the page showed the old answer for up to an hour
         * after the player gave a new one.
         */
        $character = md5($snapshot->featuredCharacter ?? '');
        $answered = $this->choices->lastAnswerAt($snapshot->accountId) ?? 'none';

        return 'gw2:dashboard:v'.self::PAYLOAD_VERSION
            .":{$snapshot->accountId}:{$pin}:{$character}:{$answered}:".($snapshot->observedAt ?? 'never');
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
                'season' => app(VaultSeason::class)->for($snapshot),
                'today' => app(DailyChecklist::class)->for($snapshot),
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

        // Null when the read had no mastery points — a key without
        // `progression` — and then nobody can say which insights are left.
        $unlocked = MasteryInsights::unlockedFor($gw2AccountId);
        $zones = app(MasteryInsights::class)->zones($unlocked);

        foreach ($snapshot->masteryRegions as $region) {
            $tracks = $snapshot->tracksIn($region->region);

            if ($tracks === []) {
                continue;
            }

            $total = $snapshot->pointsTotalIn($region->region);
            $spent = $snapshot->pointsSpentIn($region->region);
            $maps = $zones[$region->region] ?? [];

            $regions[] = [
                'region' => $region->region,
                'earned' => $region->earned,
                'spent' => $region->spent,
                'unspent' => $region->unspent(),
                'points_spent' => $spent,
                'points_total' => $total,
                'percent' => $total > 0 ? (int) round($spent / $total * 100) : 0,
                /*
                 * How many more points would buy everything here. Zero means
                 * the region already has every point its tracks can spend, and
                 * collecting another insight there changes nothing — which the
                 * page says rather than sending somebody on the walk.
                 */
                'points_needed' => max(0, $total - $region->earned),
                'points_to_get' => $this->pointsToGet($snapshot, $region->region, $maps),
                // The zone map: each map's frame and its insights, collected or
                // not. Waypoints stay out — the list above carries the ones
                // that matter, and the map has no room for the rest.
                'zones' => array_map(fn ($map) => [
                    ...$map,
                    'insights' => array_map(fn ($i) => [
                        'id' => $i['id'],
                        'coord' => $i['coord'],
                        'collected' => $i['collected'],
                    ], $map['insights']),
                ], $maps),
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
                    'wiki' => Wiki::named($t->name),
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
            'insights_known' => $unlocked !== null,
            // The row along the foot of mockup 3, from the same list the
            // dashboard's easy wins come from.
            'easy_wins' => array_slice($this->achievementCard($snapshot)['closest'], 0, 5),
            'unpaired' => array_map(fn (MasteryTrack $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'catalogue_region' => $t->catalogueRegion,
                'tiers' => $t->tiers(),
                'points_total' => $t->pointsTotal(),
                'wiki' => Wiki::named($t->name),
            ], $unpaired),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * Where a region's next mastery points are, best first — mockup 3's list.
     *
     * Two sources, and only two, because only these are certain: achievements
     * the account is close to finishing whose rewards name this region, and
     * insights on the map that `account/mastery/points` does not list as
     * unlocked. The mockup's "1–2 hours · Easy" is not here — the game reports
     * how long nothing takes — and in its place each insight says how far it
     * is from its nearest waypoint, in a straight line, and gives that
     * waypoint's chat code.
     *
     * The order: an achievement one step from done, then insights nearest a
     * waypoint first, then achievements with more to do. A single step is the
     * surest point there is; a walk is surer than several steps.
     *
     * @param  array<int, array<string, mixed>>  $maps  This region's zones, with waypoints.
     * @return array<int, array<string, mixed>>
     */
    private function pointsToGet(Snapshot $snapshot, string $region, array $maps): array
    {
        $achievements = [];

        foreach ($snapshot->nearlyDone as $win) {
            if (MasteryRegions::toAccountName($win->masteryRegion) !== $region) {
                continue;
            }

            $achievements[] = [
                'kind' => 'achievement',
                'id' => $win->id,
                'name' => $win->name,
                'icon' => $win->icon,
                'current' => $win->current,
                'max' => $win->max,
                'remaining' => $win->remaining(),
                'points' => $win->points,
                'next_step' => ($win->remainingSteps()[0] ?? null)?->text ?? $win->requirement,
                'wiki' => Wiki::named($win->name),
            ];
        }

        $insights = [];

        foreach ($maps as $map) {
            foreach ($map['insights'] as $insight) {
                // Collected, or not known — a key without `progression`. Only
                // the ones the account certainly lacks are worth the walk.
                if ($insight['collected'] !== false) {
                    continue;
                }

                $insights[] = [
                    'kind' => 'insight',
                    'id' => $insight['id'],
                    'map_id' => $map['id'],
                    'map' => $map['name'],
                    'map_slug' => $map['slug'],
                    'coord' => $insight['coord'],
                    'waypoint' => $insight['nearest_waypoint']['name'] ?? null,
                    'chat_link' => $insight['nearest_waypoint']['chat_link'] ?? null,
                    'distance' => $insight['nearest_waypoint']['distance'] ?? null,
                    'reach' => $insight['reach'],
                ];
            }
        }

        usort($achievements, fn ($a, $b) => $a['remaining'] <=> $b['remaining']);
        usort($insights, fn ($a, $b) => ($a['distance'] ?? PHP_INT_MAX) <=> ($b['distance'] ?? PHP_INT_MAX));

        return array_slice([
            ...array_values(array_filter($achievements, fn ($a) => $a['remaining'] <= 1)),
            ...$insights,
            ...array_values(array_filter($achievements, fn ($a) => $a['remaining'] > 1)),
        ], 0, self::POINTS_TO_GET);
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
        $root = $tree->plan($itemId, $quantity, $snapshot->owned, $disciplines, $this->learnedRecipes($gw2AccountId), $snapshot->wallet);
        $list = $tree->shoppingList($root);

        return [
            'target' => [
                'item_id' => (int) $target->id,
                'name' => $target->name,
                'rarity' => $target->rarity,
                'type' => $target->type,
                'icon' => $target->icon,
                'quantity' => $quantity,
                'wiki' => Wiki::item((int) $target->id),
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
                // A wallet currency in a forge recipe — Spirit Shards, coin.
                'currency_id' => $n->currencyId,
                'name' => $n->name,
                'rarity' => $n->rarity,
                'icon' => $n->icon,
                'wiki' => $n->currencyId === null ? Wiki::item($n->itemId) : null,
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
            // A discipline recipe only. The Mystic Forge is open to everybody
            // and has no rating, so "nobody on the account has it" would be false.
            'requires' => $root->recipeId !== null ? [
                'disciplines' => $root->disciplines,
                'min_rating' => $root->minRating,
                'have_it' => array_intersect($root->disciplines, $disciplines) !== [],
            ] : null,
            /*
             * Recipes taught by a sheet that the account has not learned. A
             * plan can be fully stocked and still impossible at the crafting
             * station without these; null when the account's recipes are not
             * known, which is not the same as none missing.
             */
            'recipes_to_learn' => $this->learnedRecipes($gw2AccountId) === null ? null : array_map(fn (RecipeNode $n) => [
                'recipe_id' => $n->recipeId,
                'item_id' => $n->itemId,
                'name' => $n->name,
                'icon' => $n->icon,
                'disciplines' => $n->disciplines,
                'wiki' => Wiki::item($n->itemId),
            ], $tree->toLearn($root)),
            'prices' => $this->priceBuckets($list),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * One character's ascended armour: the pieces, what the missing ones take
     * out of one stock, and how the set has come along — mockup 2.
     *
     * The weight and stats are read off what the character wears and handed
     * back as a choice (see AscendedSet), so `stats` here is the player's
     * answer when they gave one and the worn prefix when they did not.
     *
     * @return array<string, mixed>|null
     */
    public function ascended(int $gw2AccountId, ?string $characterName = null, ?string $stats = null, ?string $weight = null): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        $set = app(AscendedSet::class);
        $character = $set->character($snapshot, $characterName);

        if (! $character) {
            return null;
        }

        $choice = $set->choose($character, $stats, $weight);
        $targets = array_intersect_key($choice['targets'], array_flip($set->missing($character)));

        $tree = app(RecipeTree::class);
        $learned = $this->learnedRecipes($gw2AccountId);
        $root = null;

        if ($targets !== []) {
            // Every character's disciplines, for the same reason as plan():
            // the account crafts, not the character the page is about.
            $disciplines = array_values(array_unique(array_merge(
                ...array_map(fn (CharacterView $c) => $c->craftingDisciplines, $snapshot->characters)
            )));

            $root = $tree->planMany(
                array_map(fn ($t) => $t['id'], array_values($targets)),
                $snapshot->owned,
                $disciplines,
                $learned,
                $snapshot->wallet
            );
        }

        $pieces = $set->pieces($character, $choice['targets'], $root, $choice['stats']);

        /*
         * What is still to make. A piece already in the bank is planned like
         * the rest so that its stock is spent first, and is then left out of
         * the materials — its row says "equip it", and its own materials are
         * not missing from anything.
         */
        $making = $root === null ? null : new RecipeNode(
            itemId: 0, name: null, rarity: null, icon: null, needed: 0, owned: 0,
            children: array_values(array_filter($root->children, fn (RecipeNode $p) => $p->missing() > 0)),
        );

        $prices = $making !== null && $making->children !== [] ? $this->priceBuckets($tree->shoppingList($making)) : null;

        $crafting = null;

        if ($making !== null && $making->children !== []) {
            $required = array_values(array_unique(array_merge(...array_map(fn (RecipeNode $p) => $p->disciplines, $making->children))));
            $crafters = $set->crafters($gw2AccountId, $required);
            $minRating = max(array_map(fn (RecipeNode $p) => $p->minRating, $making->children));

            $crafting = [
                'disciplines' => $required,
                'min_rating' => $minRating,
                'crafters' => $crafters,
                'ready' => array_filter($crafters, fn ($c) => $c['active'] && $c['rating'] >= $minRating) !== [],
            ];
        }

        $toLearn = $making === null || $learned === null ? null : array_map(fn (RecipeNode $n) => [
            'recipe_id' => $n->recipeId,
            'item_id' => $n->itemId,
            'name' => $n->name,
            'icon' => $n->icon,
            'disciplines' => $n->disciplines,
            'wiki' => Wiki::item($n->itemId),
        ], $tree->toLearn($making));

        /*
         * The crafts the game allows once a day. They set the pace of the
         * whole set — five Lumps of Mithrillium are five days whatever the
         * budget — so the plan says how many days, not just how many lumps.
         */
        $gated = null;

        if ($making !== null && $making->children !== []) {
            $done = json_decode((string) DB::table('gw2_account_state')->where('gw2_account_id', $gw2AccountId)->value('daily_crafting'), true);
            $items = app(LegendaryPlanner::class)->today($making->toArray(), is_array($done) ? $done : null);

            $gated = $items === [] ? null : [
                'items' => $items,
                'days' => max(array_column($items, 'missing')),
            ];
        }

        return [
            'character' => [
                'name' => $character->name,
                'profession' => $character->profession,
                'level' => $character->level,
            ],
            'characters' => $set->characters($snapshot->characters),
            'weight' => $choice['weight'],
            'weight_known' => $choice['weight_known'],
            'stats' => $choice['stats'],
            'stats_worn' => $choice['stats_worn'],
            'stat_options' => $choice['options'],
            'done' => count(array_filter($pieces, fn ($p) => $p['state'] === 'done')),
            'total' => count(AscendedSet::ARMOUR),
            'core' => ['done' => $character->ascendedSlots, 'total' => $character->coreSlots],
            'pieces' => $pieces,
            'others' => $set->others($character),
            // Every leaf the pieces still to make draw on, the ones already
            // covered included: the page's "already yours" tab is this list.
            'materials' => $making === null ? [] : array_map(fn (RecipeNode $n) => [
                'item_id' => $n->itemId,
                'currency_id' => $n->currencyId,
                'name' => $n->name,
                'rarity' => $n->rarity,
                'icon' => $n->icon,
                'wiki' => $n->currencyId === null ? Wiki::item($n->itemId) : null,
                'needed' => $n->needed,
                'owned' => $n->owned,
                'missing' => $n->missing(),
            ], $tree->shoppingList($making, held: true)),
            'prices' => $prices,
            'crafting' => $crafting,
            'recipes_to_learn' => $toLearn,
            'time_gated' => $gated,
            'path' => $set->path($pieces, $crafting, $toLearn, $gated, $prices),
            'progress' => $set->progress($gw2AccountId, $character->name),
            'guide' => $set->guide(),
            'related' => $set->related($snapshot, $character),
            'pinned' => in_array(AscendedSet::GOAL, array_column($this->choices->pins($gw2AccountId), 'slug'), true),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * Recipe ids from `account/recipes`, or null when that was never read.
     *
     * @return array<int, int>|null
     */
    private function learnedRecipes(int $gw2AccountId): ?array
    {
        $unlocks = json_decode((string) DB::table('gw2_account_state')
            ->where('gw2_account_id', $gw2AccountId)
            ->value('unlocks'), true);

        return is_array($unlocks) && isset($unlocks['recipes']) && is_array($unlocks['recipes'])
            ? array_map('intval', $unlocks['recipes'])
            : null;
    }

    /**
     * An evening: a plan, the priorities behind it, and what is scheduled.
     *
     * Built entirely out of recommendations that already hold. The advisor has
     * decided what is worth doing and how sure it is; this only orders a subset
     * into something that fits the time. A planner that generated its own
     * activities would be a second advisor with no rules behind it.
     *
     * Weighed like the dashboard: for the pinned goal when there is one, and
     * without whatever the player has said is not for tonight.
     *
     * @param  array<int, string>  $avoid
     * @return array<string, mixed>|null
     */
    public function tonight(int $gw2AccountId, ?int $minutes, array $avoid = []): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        $advice = $this->advisor->advise($snapshot, new Intent(
            goal: $this->choices->pins($snapshot->accountId)[0]['slug'] ?? null,
            minutes: $minutes,
            avoid: $avoid,
        ));

        return [
            'plan' => app(SessionPlan::class)->build(
                [...$advice['headline'], ...$advice['alternatives']],
                $minutes
            ),
            'priorities' => $this->priorities($snapshot),
            'events' => $this->events($snapshot),
            /*
             * The vault, its season and the daily checklist live here since
             * the redesign of 28 October 2026. They were down the dashboard's
             * right-hand column, which the mockup gives to two panels; what
             * resets tonight belongs on the page about tonight.
             */
            'vault' => $this->vaultCard($snapshot),
            'season' => app(VaultSeason::class)->for($snapshot),
            'today' => app(DailyChecklist::class)->for($snapshot),
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
    private function events(Snapshot $snapshot): array
    {
        if (! Schema::hasTable('gw2_events')) {
            return [];
        }

        $now = (int) now()->utc()->format('H') * 60 + (int) now()->utc()->format('i');

        /*
         * A world boss's slug is its `/v2/worldbosses` id, so the account's
         * own read says whether it is already done today. "Not killed yet,
         * next in 12 minutes" is the line no timer site can show — they have
         * no key.
         */
        $killed = array_flip($snapshot->bossesToday);

        return DB::table('gw2_events')
            ->where('is_published', true)
            ->whereNotNull('verified_at')
            ->get(['name', 'slug', 'kind', 'region', 'waypoint', 'waypoint_chat_link', 'daily_times_utc', 'duration_minutes', 'rewards'])
            ->map(function ($event) use ($now, $killed) {
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
                    'waypoint_chat_link' => $event->waypoint_chat_link ?? null,
                    'rewards' => $event->rewards,
                    'minutes_away' => $next,
                    'live_now' => $next !== null && $event->duration_minutes
                        && $next >= 1440 - (int) $event->duration_minutes,
                    // Null for anything that is not a world boss: the API
                    // reports kills for those fifteen and nothing else.
                    'killed_today' => $event->kind === 'world_boss' ? isset($killed[$event->slug]) : null,
                ];
            })
            ->filter(fn ($e) => $e['minutes_away'] !== null)
            // What is still to do first, soonest first; done ones after.
            ->sortBy(fn ($e) => [$e['killed_today'] === true ? 1 : 0, $e['minutes_away']])
            ->take(8)
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
        $currencies = [];
        $observedAt = null;

        foreach ($list as $node) {
            /*
             * A forge recipe's currency. Coin (id 1) is gold already and goes
             * into both totals as it stands; every other currency has no
             * exchange rate to gold and is listed on its own.
             */
            if ($node->currencyId !== null) {
                if ($node->currencyId === 1) {
                    $buyNow += $node->missing();
                    $bidAndWait += $node->missing();
                } else {
                    $currencies[] = ['currency_id' => $node->currencyId, 'name' => $node->name, 'missing' => $node->missing()];
                }

                continue;
            }

            $price = $prices[$node->itemId] ?? null;

            if (! $price || ($price->sell_unit === null && $price->buy_unit === null)) {
                // Linked, because "cannot be bought" leaves exactly one question
                // — where it comes from — and the wiki is where that is written.
                $untradable[] = [
                    'item_id' => $node->itemId,
                    'name' => $node->name,
                    'missing' => $node->missing(),
                    'wiki' => Wiki::item($node->itemId),
                ];

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
            // Wallet currencies still short, from forge recipes.
            'currencies' => $currencies,
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
            'items' => array_map(
                fn (array $item) => $item + ['wiki' => Wiki::item($item['id'])],
                $character->slotItems
            ),
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
            // Shaped by the achievements page's own mapper, so a card reads
            // the same in both places.
            'closest' => array_map([Achievements::class, 'win'], array_slice($snapshot->nearlyDone, 0, 8)),
        ];
    }

    /**
     * The achievements page.
     *
     * @return array<string, mixed>|null
     */
    public function achievements(int $gw2AccountId): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        return $snapshot ? app(Achievements::class)->for($snapshot) : null;
    }

    /**
     * The fractals page.
     *
     * @return array<string, mixed>|null
     */
    public function fractals(int $gw2AccountId, ?string $characterName = null): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        return $snapshot ? app(Fractals::class)->for($snapshot, $characterName) : null;
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
        return $this->history($snapshot->accountId);
    }

    /**
     * The same history, for the account page — which has no snapshot to hand
     * and needs none, since none of this is read from one.
     *
     * @return array<string, mixed>
     */
    public function history(int $gw2AccountId): array
    {
        $events = DB::table('gw2_progress_events')
            ->where('gw2_account_id', $gw2AccountId)
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

        // A piece's id is an item id, which overlaps the achievement ids, so
        // the two are looked up apart.
        $pieceIds = $events
            ->filter(fn ($e) => $e->type === 'ascended_piece')
            ->map(fn ($e) => json_decode($e->payload, true)['id'] ?? null)
            ->filter()
            ->all();

        $pieces = $pieceIds === []
            ? collect()
            : DB::table('gw2_items')->whereIn('id', $pieceIds)->pluck('name', 'id');

        return [
            'events' => $events->map(fn ($e) => [
                'type' => $e->type,
                'id' => json_decode($e->payload, true)['id'] ?? null,
                // Named where we can. An id on its own is not a thing anybody
                // recognises as their own progress.
                'name' => ($e->type === 'ascended_piece' ? $pieces : $names)[json_decode($e->payload, true)['id'] ?? 0] ?? null,
                'occurred_at' => $e->occurred_at,
            ])->all(),
            'tracked_since' => DB::table('gw2_accounts')->where('id', $gw2AccountId)->value('created_at'),
        ];
    }
}
