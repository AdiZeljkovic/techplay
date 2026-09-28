<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * What it actually takes to craft something, given what the account already has.
 *
 * Entirely local. The 13,198 recipes and 74,265 items are mirrored, so expanding
 * a plan is a handful of indexed queries rather than a walk over the game's API —
 * which would be impossible anyway: the tree for one ascended shoulderpiece is
 * ninety nodes across six levels, and the rate limit belongs to the whole site.
 *
 * ── The one rule that makes this useful ────────────────────────────────
 *
 * **What you own, you do not expand.** Holding two Deldrimor Steel Ingots means
 * two fewer to make, and the iron and the ore behind those two are not on the
 * list at all. A planner that expands everything and subtracts at the bottom
 * tells people to go and buy what is already in their bank — which is the single
 * failure this whole feature exists to avoid.
 *
 * Inventory is counted once across the whole account. The ledger keeps a row per
 * location because "where is it" is a real question, but "do I have enough" is a
 * different one and it has to add the bank to the bags to material storage.
 */
class RecipeTree
{
    /**
     * Deeper than any real recipe, and a cycle guard that costs nothing.
     *
     * Measured: an ascended shoulderpiece bottoms out at six. A recipe graph
     * that refers to itself would otherwise expand until memory ran out, and the
     * game's data is not ours to trust with that.
     */
    private const MAX_DEPTH = 10;

    /** @var array<int, array<int, object>> output item id => its recipes */
    private array $recipes = [];

    /** @var array<int, object> */
    private array $items = [];

    /**
     * Expand a target into everything still to obtain.
     *
     * @param  array<int, int>  $owned  Item id => how many, across the whole account.
     * @param  array<int, string>  $disciplines  Active crafting disciplines, to break ties.
     */
    public function plan(int $itemId, int $quantity, array $owned, array $disciplines = []): RecipeNode
    {
        $this->warm($itemId);

        /*
         * The stock is a pool that gets spent, not a figure each branch reads.
         *
         * This is the part that is easy to get wrong and silent when it is. A
         * material reaches the same plan down several branches — Mithril Ore
         * arrives through the ingot, the plate and the setting — and if every
         * branch subtracts the same twenty ore from the same bank, the plan
         * reports a shortfall twenty smaller than it is on each of them. Passing
         * the pool by reference means the first branch takes what it needs and
         * the next one sees what is left.
         */
        $pool = $owned;

        return $this->expand($itemId, $quantity, $pool, $disciplines, [], 0);
    }

    /**
     * Everything with nothing beneath it that is still missing.
     *
     * The shopping list. Intermediates are interesting to look at and useless to
     * act on — nobody buys a Deldrimor Steel Ingot they are going to make.
     *
     * @return array<int, RecipeNode>
     */
    public function shoppingList(RecipeNode $root): array
    {
        $leaves = [];

        $walk = function (RecipeNode $node) use (&$walk, &$leaves): void {
            if ($node->children === []) {
                if ($node->missing() > 0) {
                    // Merge rather than append: the same material reaches the
                    // same plan down several branches, and six entries for
                    // Mithril Ore is a list nobody can read. Both figures sum,
                    // because each branch drew from a disjoint part of the pool.
                    $leaves[$node->itemId] = isset($leaves[$node->itemId])
                        ? $this->merge($leaves[$node->itemId], $node)
                        : $node;
                }

                return;
            }

            foreach ($node->children as $child) {
                $walk($child);
            }
        };

        $walk($root);

        uasort($leaves, fn (RecipeNode $a, RecipeNode $b) => $b->missing() <=> $a->missing());

        return array_values($leaves);
    }

    /**
     * @param  array<int, int>  $pool  Stock still unspent. Mutated as it is drawn down.
     * @param  array<int, string>  $disciplines
     * @param  array<int, bool>  $path  Item ids already open above this one.
     */
    private function expand(int $itemId, int $needed, array &$pool, array $disciplines, array $path, int $depth): RecipeNode
    {
        $item = $this->items[$itemId] ?? null;

        // Draw from the pool and keep it drawn. Whatever this branch takes is
        // not there for the next one.
        $taken = min($pool[$itemId] ?? 0, $needed);
        $pool[$itemId] = ($pool[$itemId] ?? 0) - $taken;
        $missing = $needed - $taken;

        $node = fn (array $children = [], ?object $recipe = null, bool $chosen = false) => new RecipeNode(
            itemId: $itemId,
            name: $item->name ?? null,
            rarity: $item->rarity ?? null,
            icon: $item->icon ?? null,
            needed: $needed,
            owned: $taken,
            children: $children,
            recipeId: $recipe?->id,
            disciplines: $recipe ? $this->json($recipe->disciplines) : [],
            minRating: (int) ($recipe->min_rating ?? 0),
            depth: $depth,
            recipeWasChosen: $chosen,
        );

        /*
         * Three reasons to stop here, and none of them is an error.
         *
         * Nothing missing: the account has enough, so what goes into it is not
         * this plan's business. Too deep, or already open above: the game's
         * recipe graph is not ours to trust with unbounded recursion.
         */
        if ($missing === 0 || $depth >= self::MAX_DEPTH || isset($path[$itemId])) {
            return $node();
        }

        $recipes = $this->recipes[$itemId] ?? [];

        if ($recipes === []) {
            return $node();
        }

        $recipe = $this->choose($recipes, $disciplines);
        $path[$itemId] = true;

        /*
         * A recipe may produce more than one — five Spools of Thread from one
         * craft. Rounding up is the honest answer: you cannot make four fifths
         * of a craft, and telling somebody they need 0.8 batches helps nobody.
         */
        $batches = (int) ceil($missing / max(1, (int) $recipe->output_item_count));

        $children = [];

        foreach ($this->json($recipe->ingredients) as $ingredient) {
            if (! isset($ingredient['item_id'])) {
                continue;
            }

            $children[] = $this->expand(
                (int) $ingredient['item_id'],
                (int) ($ingredient['count'] ?? 1) * $batches,
                $pool,
                $disciplines,
                $path,
                $depth + 1,
            );
        }

        return $node($children, $recipe, count($recipes) > 1);
    }

    /**
     * Which recipe, when an item has several.
     *
     * Rare — 105 items of 13,065 — and almost always the same ingredients under
     * a different discipline, so the choice usually changes nothing except who
     * can make it. Preferring a discipline the character actually has is
     * therefore free, and occasionally the difference between a plan they can
     * follow and one they cannot.
     *
     * @param  array<int, object>  $recipes
     * @param  array<int, string>  $disciplines
     */
    private function choose(array $recipes, array $disciplines): object
    {
        if ($disciplines !== []) {
            foreach ($recipes as $recipe) {
                if (array_intersect($this->json($recipe->disciplines), $disciplines) !== []) {
                    return $recipe;
                }
            }
        }

        // Otherwise the least demanding one, so a plan is not gated behind a
        // rating the account has no reason to have.
        usort($recipes, fn ($a, $b) => $a->min_rating <=> $b->min_rating);

        return $recipes[0];
    }

    /**
     * Load the whole recipe graph reachable from a target, breadth first.
     *
     * One query per level rather than one per node: a ninety-node tree would
     * otherwise be ninety round trips, and `preventLazyLoading` exists in this
     * codebase precisely because that pattern keeps reappearing.
     */
    private function warm(int $itemId): void
    {
        $frontier = [$itemId];
        $seen = [];

        for ($level = 0; $level < self::MAX_DEPTH && $frontier !== []; $level++) {
            $frontier = array_values(array_diff($frontier, $seen));

            if ($frontier === []) {
                break;
            }

            $seen = array_merge($seen, $frontier);

            $rows = DB::table('gw2_recipes')
                ->whereIn('output_item_id', $frontier)
                ->get(['id', 'output_item_id', 'output_item_count', 'ingredients', 'disciplines', 'min_rating']);

            $next = [];

            foreach ($rows as $row) {
                $this->recipes[(int) $row->output_item_id][] = $row;

                foreach ($this->json($row->ingredients) as $ingredient) {
                    if (isset($ingredient['item_id'])) {
                        $next[] = (int) $ingredient['item_id'];
                    }
                }
            }

            $frontier = array_values(array_unique($next));
        }

        $this->items = DB::table('gw2_items')
            ->whereIn('id', array_unique($seen))
            ->get(['id', 'name', 'rarity', 'icon'])
            ->keyBy('id')
            ->all();
    }

    private function merge(RecipeNode $a, RecipeNode $b): RecipeNode
    {
        return new RecipeNode(
            itemId: $a->itemId,
            name: $a->name,
            rarity: $a->rarity,
            icon: $a->icon,
            needed: $a->needed + $b->needed,
            // Summed, because the pool is spent rather than read: each branch
            // drew a disjoint part of the same stock, so adding them back up
            // recovers exactly what was there.
            owned: $a->owned + $b->owned,
            depth: min($a->depth, $b->depth),
        );
    }

    /** @return array<mixed> */
    private function json(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        $decoded = is_string($value) ? json_decode($value, true) : null;

        return is_array($decoded) ? $decoded : [];
    }
}
