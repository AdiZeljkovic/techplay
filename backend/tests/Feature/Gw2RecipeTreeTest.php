<?php

namespace Tests\Feature;

use App\Services\Gw2\Advisor\RecipeNode;
use App\Services\Gw2\Advisor\RecipeTree;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * A crafting plan has to subtract the bank exactly once.
 *
 * The failure this guards against is specific and silent. A material reaches the
 * same plan down several branches — mithril arrives through the ingot, the plate
 * and the setting — and if each branch subtracts the same twenty ore from the
 * same bank, every branch reports a shortfall twenty smaller than it is. The
 * plan looks plausible, the totals are wrong, and the player finds out at the
 * crafting station.
 *
 * The shapes below are the real ones: an ascended shoulderpiece expands to
 * ninety nodes across six levels, with materials repeating across branches.
 */
class Gw2RecipeTreeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A deliberately awkward little graph.
     *
     *   1000 Chestpiece          needs 2× 2000 and 1× 3000
     *   2000 Steel Ingot         needs 3× 4000            (ore)
     *   3000 Steel Plate         needs 5× 4000            (the same ore)
     *   4000 Mithril Ore         not crafted
     *   5000 Thread              made five at a time from 6000
     */
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            [1000, 'Ascended Chestpiece', 'Ascended'],
            [2000, 'Deldrimor Steel Ingot', 'Rare'],
            [3000, 'Deldrimor Steel Plate', 'Rare'],
            [4000, 'Mithril Ore', 'Basic'],
            [5000, 'Spool of Thread', 'Basic'],
            [6000, 'Pile of Dust', 'Basic'],
        ] as [$id, $name, $rarity]) {
            DB::table('gw2_items')->insert(['id' => $id, 'name' => $name, 'rarity' => $rarity, 'level' => 0]);
        }

        $this->recipe(1, 1000, 1, [[2000, 2], [3000, 1]]);
        $this->recipe(2, 2000, 1, [[4000, 3]]);
        $this->recipe(3, 3000, 1, [[4000, 5]]);
        $this->recipe(4, 5000, 5, [[6000, 1]]);
    }

    public function test_the_same_material_in_two_branches_is_counted_once_against_the_bank(): void
    {
        // One chestpiece: two ingots at 3 ore each, one plate at 5 ore. Eleven
        // ore in total, and the bank holds four.
        $plan = app(RecipeTree::class)->plan(1000, 1, [4000 => 4]);

        $ore = $this->leaf($plan, 4000);

        $this->assertSame(11, $ore->needed, 'the whole plan wants eleven ore');
        $this->assertSame(4, $ore->owned, 'the four in the bank are four, not four per branch');
        $this->assertSame(7, $ore->missing());
    }

    public function test_owning_the_intermediate_removes_everything_beneath_it(): void
    {
        // Two ingots in hand means six ore that nobody has to mine, and it must
        // not appear on the list at all.
        $plan = app(RecipeTree::class)->plan(1000, 1, [2000 => 2]);

        $ore = $this->leaf($plan, 4000);

        $this->assertSame(5, $ore->needed, 'only the plate still needs ore');

        $ingot = $this->child($plan, 2000);
        $this->assertSame(2, $ingot->owned);
        $this->assertSame([], $ingot->children, 'a thing you own is not a shopping list');
    }

    public function test_a_recipe_that_makes_several_rounds_up(): void
    {
        // Thread comes five at a time. Six thread is two crafts, not 1.2.
        $plan = app(RecipeTree::class)->plan(5000, 6, []);

        $this->assertSame(2, $this->leaf($plan, 6000)->needed);
    }

    public function test_a_plan_for_something_already_in_the_bank_asks_for_nothing(): void
    {
        $plan = app(RecipeTree::class)->plan(1000, 1, [1000 => 1]);

        $this->assertSame(0, $plan->missing());
        $this->assertSame([], $plan->children);
        $this->assertSame([], app(RecipeTree::class)->shoppingList($plan));
    }

    public function test_the_shopping_list_holds_leaves_and_never_intermediates(): void
    {
        $tree = app(RecipeTree::class);
        $plan = $tree->plan(1000, 1, []);

        $ids = array_map(fn (RecipeNode $n) => $n->itemId, $tree->shoppingList($plan));

        // Ore, because it is bought or gathered. Never the ingot or the plate —
        // nobody buys a thing they are about to make.
        $this->assertSame([4000], $ids);
    }

    public function test_a_recipe_that_refers_to_itself_does_not_run_forever(): void
    {
        /*
         * Not hypothetical enough to ignore. The recipe graph is ArenaNet's and
         * we mirror it as given; one self-referential row would otherwise expand
         * until the process ran out of memory, taking a queue worker with it.
         */
        $this->recipe(9, 7000, 1, [[7000, 1], [4000, 1]]);
        DB::table('gw2_items')->insert(['id' => 7000, 'name' => 'Impossible Thing', 'level' => 0]);

        $plan = app(RecipeTree::class)->plan(7000, 1, []);

        $this->assertNotSame([], $plan->children);
        $this->assertLessThan(12, $this->deepest($plan));
    }

    public function test_the_discipline_the_character_has_breaks_a_tie(): void
    {
        // The same item from two recipes, as 105 items in the catalogue really
        // are — usually identical ingredients under a different discipline.
        $this->recipe(20, 8000, 1, [[4000, 1]], ['Armorsmith'], 400);
        $this->recipe(21, 8000, 1, [[4000, 1]], ['Tailor'], 100);
        DB::table('gw2_items')->insert(['id' => 8000, 'name' => 'Either Way', 'level' => 0]);

        $withTailor = app(RecipeTree::class)->plan(8000, 1, [], ['Tailor']);
        $this->assertSame(['Tailor'], $withTailor->disciplines);
        $this->assertTrue($withTailor->recipeWasChosen, 'the plan should say a choice was made');

        // With nothing to go on, the least demanding recipe — a plan should not
        // be gated behind a rating the account has no reason to have.
        $withNothing = app(RecipeTree::class)->plan(8000, 1, []);
        $this->assertSame(100, $withNothing->minRating);
    }

    /** @param array<int, array{0: int, 1: int}> $ingredients */
    private function recipe(int $id, int $output, int $count, array $ingredients, array $disciplines = ['Armorsmith'], int $rating = 0): void
    {
        DB::table('gw2_recipes')->insert([
            'id' => $id,
            'output_item_id' => $output,
            'output_item_count' => $count,
            'ingredients' => json_encode(array_map(fn ($i) => ['item_id' => $i[0], 'count' => $i[1]], $ingredients)),
            'disciplines' => json_encode($disciplines),
            'min_rating' => $rating,
        ]);
    }

    /** The merged leaf for one item across the whole plan. */
    private function leaf(RecipeNode $root, int $itemId): RecipeNode
    {
        foreach (app(RecipeTree::class)->shoppingList($root) as $leaf) {
            if ($leaf->itemId === $itemId) {
                return $leaf;
            }
        }

        $this->fail("Item {$itemId} is not on the shopping list.");
    }

    private function child(RecipeNode $root, int $itemId): RecipeNode
    {
        foreach ($root->children as $child) {
            if ($child->itemId === $itemId) {
                return $child;
            }
        }

        $this->fail("Item {$itemId} is not a direct child.");
    }

    private function deepest(RecipeNode $node): int
    {
        return $node->children === []
            ? $node->depth
            : max(array_map(fn (RecipeNode $c) => $this->deepest($c), $node->children));
    }
}
