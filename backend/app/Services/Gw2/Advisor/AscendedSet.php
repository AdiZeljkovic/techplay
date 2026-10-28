<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Guide;
use App\Services\Gw2\Wiki;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * One character's ascended armour — mockup 2's goal page.
 *
 * The crafting planner asks the player to name an item, and says why: an
 * ascended set comes in an armour weight and a stat prefix, and nothing in the
 * API says which one somebody wants. This page still does not guess. It reads
 * both off what the character is wearing — the weight from the armour's own
 * `weight_class`, the stats from the most common prefix across the six pieces —
 * and shows them as a choice the player can change, not as a decision made for
 * them. A Mesmer in six exotic Celestial pieces is offered a Celestial set;
 * nothing is offered from a table of which profession wears what.
 *
 * Stats are matched by **name**, not id. The game has five item stats called
 * Berserker's (161, 584, 599, 1046, 1077 on 28 October 2026), and the exotic a
 * character wears does not carry the same id as the crafted ascended piece
 * that replaces it.
 *
 * What the mockup draws and this does not: "Confidence to complete: High" is
 * whether somebody on the account can craft it, which the account says; "Gold
 * spent" is not here, because nothing records what gold was spent on; and the
 * acquisition path is built from the plan itself — the discipline, the recipe
 * sheets, the time-gated crafts and the trading post — rather than from four
 * steps written in advance.
 */
class AscendedSet
{
    /** The six pieces of a crafted set, in the order the hero panel draws them. */
    public const ARMOUR = ['Helm', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots'];

    /** The other six core slots. Ascended too, and not crafted. */
    public const OTHERS = ['Backpack', 'Amulet', 'Ring1', 'Ring2', 'Accessory1', 'Accessory2'];

    public const WEIGHTS = ['Heavy', 'Medium', 'Light'];

    /** The goal this page is, for the pin. */
    public const GOAL = 'first-ascended-set';

    /** The bars on the progress chart, a game week each. */
    private const WEEKS = 6;

    /** The character asked for, or the one the advisor talks about. */
    public function character(Snapshot $snapshot, ?string $name): ?CharacterView
    {
        if ($name !== null) {
            foreach ($snapshot->characters as $character) {
                if ($character->name === $name) {
                    return $character;
                }
            }

            return null;
        }

        return $snapshot->primaryCharacter();
    }

    /**
     * Weight, stats and the crafted piece for every slot.
     *
     * The weight read from the armour wins over the one asked for: it is not a
     * preference, the profession fixes it, and a weight picker is only offered
     * when there is no armour to read it from.
     *
     * @return array{weight: ?string, weight_known: bool, stats: ?string, stats_worn: ?string, options: array<int, string>, targets: array<string, array{id: int, name: string, icon: ?string}>}
     */
    public function choose(CharacterView $character, ?string $stats, ?string $weight): array
    {
        $names = $this->statNames();
        $worn = $this->wornWeight($character);
        $weight = $worn ?? (in_array($weight, self::WEIGHTS, true) ? $weight : null);
        $crafted = $weight !== null ? $this->crafted($weight, $names) : [];
        $wornStats = $this->wornStats($character, $names);

        $chosen = match (true) {
            $stats !== null && isset($crafted[$stats]) => $stats,
            $wornStats !== null && isset($crafted[$wornStats]) => $wornStats,
            default => null,
        };

        return [
            'weight' => $weight,
            'weight_known' => $worn !== null,
            'stats' => $chosen,
            'stats_worn' => $wornStats,
            'options' => array_keys($crafted),
            'targets' => $chosen !== null ? $crafted[$chosen] : [],
        ];
    }

    /**
     * Armour slots still below ascended, empty ones included.
     *
     * @return array<int, string>
     */
    public function missing(CharacterView $character): array
    {
        return array_values(array_filter(self::ARMOUR, fn (string $slot) => ! self::ascended($character, $slot)));
    }

    /**
     * The six armour pieces, each with what it is now and what replaces it.
     *
     * `owned` is a piece the account already holds somewhere — crafted, or
     * dropped, and sitting in the bank. Telling somebody to craft what they
     * only have to equip is the planner's oldest failure.
     *
     * @param  array<string, array{id: int, name: string, icon: ?string}>  $targets
     * @return array<int, array<string, mixed>>
     */
    public function pieces(CharacterView $character, array $targets, ?RecipeNode $plan, ?string $stats): array
    {
        $planned = [];

        foreach ($plan?->children ?? [] as $node) {
            $planned[$node->itemId] = $node;
        }

        return array_map(function (string $slot) use ($character, $targets, $planned, $stats) {
            $done = self::ascended($character, $slot);
            $target = $done ? null : ($targets[$slot] ?? null);
            $node = $target !== null ? ($planned[$target['id']] ?? null) : null;

            return [
                'slot' => $slot,
                'state' => match (true) {
                    $done => 'done',
                    $stats === null => 'choose',
                    // A few stat prefixes lack a crafted piece in one slot or
                    // another; the page says so rather than plan a different one.
                    $target === null => 'unavailable',
                    $node !== null && $node->missing() === 0 => 'owned',
                    default => 'craft',
                },
                'worn' => $this->worn($character, $slot),
                'target' => $target !== null ? [
                    'item_id' => $target['id'],
                    'name' => $target['name'],
                    'icon' => $target['icon'],
                    'wiki' => Wiki::item($target['id']),
                ] : null,
            ];
        }, self::ARMOUR);
    }

    /**
     * The trinkets and the back item, for the row under the armour.
     *
     * No plan for these. They come from laurels, fractal relics, achievements
     * and vendors, and which of those is right is not something the account or
     * the catalogue says — so the row shows the state and the wiki, not a route.
     *
     * @return array<int, array<string, mixed>>
     */
    public function others(CharacterView $character): array
    {
        return array_map(fn (string $slot) => [
            'slot' => $slot,
            'state' => self::ascended($character, $slot) ? 'done' : (isset($character->slotItems[$slot]) ? 'below' : 'empty'),
            'worn' => $this->worn($character, $slot),
        ], self::OTHERS);
    }

    /**
     * Every character, for the picker, with how far their armour is.
     *
     * @param  array<int, CharacterView>  $characters
     * @return array<int, array<string, mixed>>
     */
    public function characters(array $characters): array
    {
        return array_map(fn (CharacterView $c) => [
            'name' => $c->name,
            'profession' => $c->profession,
            'level' => $c->level,
            'armour_done' => count(self::ARMOUR) - count($this->missing($c)),
        ], $characters);
    }

    /**
     * Who on the account can craft it, best placed first.
     *
     * Read from every character, not the one the page is about: crafting is
     * per character and the armour goes to whoever wears it, so a Leatherworker
     * on an alt is the answer for a Thief with no discipline at all. Inactive
     * disciplines are listed too — the rating is kept when a character
     * switches away, and switching back is a visit to a crafting station, not
     * four hundred levels.
     *
     * @param  array<int, string>  $disciplines
     * @return array<int, array{character: string, discipline: string, rating: int, active: bool}>
     */
    public function crafters(int $gw2AccountId, array $disciplines): array
    {
        $out = [];

        foreach (DB::table('gw2_characters')->where('gw2_account_id', $gw2AccountId)->get(['name', 'crafting']) as $row) {
            foreach (json_decode((string) $row->crafting, true) ?: [] as $discipline) {
                if (in_array($discipline['discipline'] ?? null, $disciplines, true)) {
                    $out[] = [
                        'character' => (string) $row->name,
                        'discipline' => (string) $discipline['discipline'],
                        'rating' => (int) ($discipline['rating'] ?? 0),
                        'active' => (bool) ($discipline['active'] ?? false),
                    ];
                }
            }
        }

        usort($out, fn ($a, $b) => [$b['rating'], $b['active']] <=> [$a['rating'], $a['active']]);

        return $out;
    }

    /**
     * The way there, built out of the plan rather than written in advance.
     *
     * Every step is one the plan actually contains: a discipline to reach, a
     * recipe sheet to learn, a time-gated craft that caps how fast the set can
     * go, a trading post bill, what no one sells, and the crafting itself. A
     * step that does not apply is left out, so a player with the discipline
     * and the materials sees two steps, not six with four ticked.
     *
     * @param  array<int, array<string, mixed>>  $pieces
     * @param  array{disciplines: array<int, string>, min_rating: int, crafters: array<int, array<string, mixed>>, ready: bool}|null  $crafting
     * @param  array<int, array<string, mixed>>|null  $toLearn
     * @param  array{items: array<int, array<string, mixed>>, days: int}|null  $gated
     * @param  array<string, mixed>|null  $prices
     * @return array<int, array<string, mixed>>
     */
    public function path(array $pieces, ?array $crafting, ?array $toLearn, ?array $gated, ?array $prices): array
    {
        $toCraft = array_values(array_filter($pieces, fn ($p) => $p['state'] === 'craft'));
        $owned = array_values(array_filter($pieces, fn ($p) => $p['state'] === 'owned'));
        $steps = [];

        if ($owned !== []) {
            $steps[] = [
                'key' => 'equip',
                'title' => count($owned) === 1 ? 'Equip the piece you already have' : 'Equip the '.count($owned).' pieces you already have',
                'body' => 'Already on the account: '.implode(', ', array_map(fn ($p) => $p['target']['name'], $owned)).'.',
                'state' => 'todo',
            ];
        }

        if ($toCraft === []) {
            return $steps;
        }

        if ($crafting !== null && $crafting['disciplines'] !== []) {
            $discipline = implode(' or ', $crafting['disciplines']);
            $best = $crafting['crafters'][0] ?? null;
            $ready = array_values(array_filter($crafting['crafters'], fn ($c) => $c['active'] && $c['rating'] >= $crafting['min_rating']));
            $parked = array_values(array_filter($crafting['crafters'], fn ($c) => ! $c['active'] && $c['rating'] >= $crafting['min_rating']));

            $steps[] = [
                'key' => 'discipline',
                'title' => "{$discipline} at {$crafting['min_rating']}",
                'body' => match (true) {
                    $ready !== [] => "{$ready[0]['character']} can craft them now.",
                    $parked !== [] => "{$parked[0]['character']} is already at {$parked[0]['rating']} — switch back to {$parked[0]['discipline']} at a crafting station.",
                    $best !== null => "Nobody on the account is there yet. {$best['character']} is the closest, at {$best['rating']}.",
                    default => 'Nobody on the account has the discipline yet.',
                },
                'state' => $ready !== [] ? 'done' : 'todo',
                'progress' => $ready === [] && $parked === [] ? [
                    'current' => $best['rating'] ?? 0,
                    'target' => $crafting['min_rating'],
                ] : null,
            ];
        }

        if ($toLearn !== null && $toLearn !== []) {
            $steps[] = [
                'key' => 'recipes',
                'title' => count($toLearn) === 1 ? 'Learn one recipe' : 'Learn '.count($toLearn).' recipes',
                'body' => 'Taught by a recipe sheet, not by the discipline.',
                'state' => 'todo',
                'items' => array_map(fn ($r) => ['name' => $r['name'], 'wiki' => $r['wiki'] ?? null], $toLearn),
            ];
        }

        if ($gated !== null && $gated['items'] !== []) {
            $steps[] = [
                'key' => 'time_gated',
                'title' => 'One time-gated craft a day',
                'body' => $gated['days'] === 1
                    ? 'Each of these can be crafted once a day, and one of each is all that is missing.'
                    : "Each of these can be crafted once a day. At one of each a day, that is {$gated['days']} days.",
                'state' => 'todo',
                'items' => array_map(fn ($g) => [
                    'name' => $g['name'],
                    'missing' => $g['missing'],
                    'done_today' => $g['crafted_today'],
                    'wiki' => Wiki::item((int) $g['item_id']),
                ], $gated['items']),
            ];
        }

        if ($prices !== null && $prices['tradable'] !== []) {
            $steps[] = [
                'key' => 'buy',
                'title' => 'Buy what the trading post sells',
                'body' => count($prices['tradable']).' materials. The figure is buying outright; bidding and waiting is cheaper.',
                'state' => 'todo',
                'cost' => ['buy_now' => $prices['buy_now'], 'bid_and_wait' => $prices['bid_and_wait']],
            ];
        }

        if ($prices !== null && $prices['not_tradable'] !== []) {
            $steps[] = [
                'key' => 'gather',
                'title' => 'Gather what nobody sells',
                'body' => 'Vendors, currencies or drops — there is no gold figure for these.',
                'state' => 'todo',
                'items' => array_map(fn ($n) => ['name' => $n['name'], 'missing' => $n['missing'], 'wiki' => $n['wiki']], $prices['not_tradable']),
            ];
        }

        $steps[] = [
            'key' => 'craft',
            'title' => count($toCraft) === 1 ? 'Craft the '.strtolower($this->label($toCraft[0]['slot'])) : 'Craft the '.count($toCraft).' pieces',
            'body' => implode(', ', array_map(fn ($p) => $p['target']['name'], $toCraft)).'.',
            'state' => 'todo',
            'progress' => [
                'current' => count(array_filter($pieces, fn ($p) => $p['state'] === 'done')),
                'target' => count(self::ARMOUR),
            ],
        ];

        return $steps;
    }

    /**
     * Pieces that became ascended, week by week, for one character.
     *
     * Written by the sync from the difference between two reads — the game
     * keeps no record of when a slot was filled, so this starts on the first
     * read after the event type existed and nothing before it can be
     * recovered. The page says so. The weeks are the game's: Monday, 07:30 UTC.
     *
     * @return array<string, mixed>
     */
    public function progress(int $gw2AccountId, string $character): array
    {
        $events = DB::table('gw2_progress_events')
            ->where('gw2_account_id', $gw2AccountId)
            ->where('type', 'ascended_piece')
            ->orderByDesc('occurred_at')
            ->limit(500)
            ->get(['payload', 'occurred_at'])
            ->map(fn ($e) => (json_decode($e->payload, true) ?: []) + ['occurred_at' => (string) $e->occurred_at])
            ->filter(fn ($e) => ($e['character'] ?? null) === $character)
            ->values();

        $ids = $events->pluck('id')->filter()->unique()->all();
        $items = $ids === [] ? collect() : DB::table('gw2_items')->whereIn('id', $ids)->get(['id', 'name', 'icon', 'rarity'])->keyBy('id');

        $reset = DailyChecklist::nextWeeklyReset();
        $weeks = [];

        for ($back = self::WEEKS; $back >= 1; $back--) {
            $end = $reset->copy()->subWeeks($back - 1);
            $start = $end->copy()->subWeek();

            $weeks[] = [
                'starts_at' => $start->toIso8601String(),
                'pieces' => $events->filter(function ($e) use ($start, $end) {
                    $at = Carbon::parse($e['occurred_at']);

                    return $at->greaterThanOrEqualTo($start) && $at->lessThan($end);
                })->count(),
            ];
        }

        return [
            'weeks' => $weeks,
            'this_week' => $weeks[count($weeks) - 1]['pieces'],
            'events' => $events->take(10)->map(fn ($e) => [
                'slot' => $e['slot'] ?? null,
                'item_id' => $e['id'] ?? null,
                'name' => $items[$e['id'] ?? 0]->name ?? null,
                'icon' => $items[$e['id'] ?? 0]->icon ?? null,
                'rarity' => $items[$e['id'] ?? 0]->rarity ?? null,
                'occurred_at' => $e['occurred_at'],
            ])->all(),
        ];
    }

    /**
     * "Why this matters", from the guide — only while it is published.
     *
     * @return array{href: string, title: string, standfirst: ?string}|null
     */
    public function guide(): ?array
    {
        $guide = Gw2Guide::query()
            ->published()
            ->where('family', 'goals')
            ->where('slug', self::GOAL)
            ->first(['family', 'slug', 'title', 'standfirst']);

        return $guide ? [
            'href' => $guide->path(),
            'title' => (string) $guide->title,
            'standfirst' => $guide->standfirst,
        ] : null;
    }

    /**
     * The other goals an ascended set feeds, each with its own measured figure.
     *
     * The mockup's "You are ready to start raiding — 100%" is not among them;
     * there is no readiness figure behind it. Raids get this week's clears.
     *
     * @return array<int, array<string, mixed>>
     */
    public function related(Snapshot $snapshot, CharacterView $character): array
    {
        $titles = DB::table('gw2_goals')
            ->where('is_active', true)
            ->whereIn('slug', ['fractals', 'masteries', 'raid-entry'])
            ->pluck('title', 'slug');

        $out = [];

        if (isset($titles['fractals'])) {
            $out[] = [
                'slug' => 'fractals',
                'title' => $titles['fractals'],
                'label' => 'Agony Resistance on '.$character->name,
                'current' => $character->agonyResistance,
                'target' => CharacterView::TIER_4_AGONY,
                'domain' => 'fractals',
                'href' => CardAction::guide('fractals', 'agony-resistance', 'Agony Resistance')['href'] ?? '/gw2/next',
            ];
        }

        $regions = array_keys($snapshot->masteryRegions);
        $total = array_sum(array_map(fn ($r) => $snapshot->pointsTotalIn($r), $regions));

        if (isset($titles['masteries']) && $total > 0) {
            $out[] = [
                'slug' => 'masteries',
                'title' => $titles['masteries'],
                'label' => $snapshot->unspentMasteryPoints().' points unspent',
                'current' => array_sum(array_map(fn ($r) => $snapshot->pointsSpentIn($r), $regions)),
                'target' => $total,
                'domain' => 'masteries',
                'href' => '/gw2/masteries',
            ];
        }

        if (isset($titles['raid-entry'])) {
            $out[] = [
                'slug' => 'raid-entry',
                'title' => $titles['raid-entry'],
                'label' => count($snapshot->raidsThisWeek).' raid encounters cleared this week',
                'current' => null,
                'target' => null,
                'domain' => 'raids',
                'href' => '/gw2/content',
            ];
        }

        return $out;
    }

    public static function ascended(CharacterView $character, string $slot): bool
    {
        return in_array($character->slotRarity[$slot] ?? null, ['Ascended', 'Legendary'], true);
    }

    /** @return array<string, mixed>|null */
    private function worn(CharacterView $character, string $slot): ?array
    {
        $item = $character->slotItems[$slot] ?? null;

        return $item === null ? null : [
            'item_id' => $item['id'],
            'name' => $item['name'],
            'icon' => $item['icon'],
            'rarity' => $item['rarity'],
            'wiki' => Wiki::item($item['id']),
        ];
    }

    private function label(string $slot): string
    {
        return $slot === 'Coat' ? 'Chest' : $slot;
    }

    /** The weight most of the worn armour is, ignoring town clothes. */
    private function wornWeight(CharacterView $character): ?string
    {
        $counts = [];

        foreach (self::ARMOUR as $slot) {
            $weight = $character->slotItems[$slot]['weight'] ?? null;

            if (in_array($weight, self::WEIGHTS, true)) {
                $counts[$weight] = ($counts[$weight] ?? 0) + 1;
            }
        }

        arsort($counts);

        return array_key_first($counts);
    }

    /**
     * The stat prefix most of the worn armour carries, by name.
     *
     * @param  array<int, string>  $names
     */
    private function wornStats(CharacterView $character, array $names): ?string
    {
        $counts = [];

        foreach (self::ARMOUR as $slot) {
            $name = $names[$character->slotItems[$slot]['stats'] ?? 0] ?? null;

            if ($name !== null) {
                $counts[$name] = ($counts[$name] ?? 0) + 1;
            }
        }

        arsort($counts);

        return array_key_first($counts);
    }

    /**
     * Every crafted ascended piece of one weight, by stat name and slot.
     *
     * Crafted means a recipe makes it, which is what separates the set a
     * player can plan from the raid, fractal and WvW pieces of the same
     * rarity. A piece with a choice of stats is left out: it has no prefix to
     * file it under, and every prefix has a fixed-stat piece already.
     *
     * @param  array<int, string>  $names
     * @return array<string, array<string, array{id: int, name: string, icon: ?string}>>
     */
    private function crafted(string $weight, array $names): array
    {
        $rows = DB::table('gw2_items')
            ->where('type', 'Armor')
            ->where('rarity', 'Ascended')
            ->where('details->weight_class', $weight)
            ->whereIn('details->type', self::ARMOUR)
            ->whereExists(fn ($q) => $q->select(DB::raw(1))
                ->from('gw2_recipes')
                ->whereColumn('gw2_recipes.output_item_id', 'gw2_items.id'))
            ->orderBy('id')
            ->get(['id', 'name', 'icon', 'details']);

        $out = [];

        foreach ($rows as $row) {
            $details = json_decode((string) $row->details, true) ?: [];
            $name = $names[(int) ($details['infix_upgrade']['id'] ?? 0)] ?? null;
            $slot = $details['type'] ?? null;

            if ($name === null || $slot === null) {
                continue;
            }

            // Lowest id first, so the same set is planned on every visit.
            $out[$name][$slot] ??= ['id' => (int) $row->id, 'name' => (string) $row->name, 'icon' => $row->icon];
        }

        ksort($out);

        return $out;
    }

    /** @return array<int, string> itemstat id => name */
    private function statNames(): array
    {
        return DB::table('gw2_reference')
            ->where('kind', 'itemstats')
            ->pluck('payload', 'ref_id')
            ->map(fn ($p) => (string) ((json_decode($p, true) ?: [])['name'] ?? ''))
            ->filter()
            ->mapWithKeys(fn ($name, $id) => [(int) $id => $name])
            ->all();
    }
}
