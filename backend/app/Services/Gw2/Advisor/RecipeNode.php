<?php

namespace App\Services\Gw2\Advisor;

/**
 * One item in a crafting plan, and what the account already has of it.
 *
 * The distinction that matters here is between `needed` and `missing`. Somebody
 * planning an ascended chestpiece needs six Deldrimor Steel Ingots and may
 * already hold two, and the only number worth acting on is the four. Reporting
 * the six is what makes a planner tell people to buy what is sitting in their
 * bank.
 *
 * `children` is empty for anything that is not crafted, or that the account
 * already holds enough of — owning the intermediate is exactly the same as
 * owning everything that goes into it, and expanding it anyway would produce a
 * shopping list for a thing already on the shelf.
 */
readonly class RecipeNode
{
    /**
     * @param  array<int, RecipeNode>  $children
     * @param  array<int, string>  $disciplines
     */
    public function __construct(
        public int $itemId,
        public ?string $name,
        public ?string $rarity,
        public ?string $icon,
        public int $needed,
        public int $owned,
        public array $children = [],
        public ?int $recipeId = null,
        public array $disciplines = [],
        public int $minRating = 0,
        public int $depth = 0,
        /**
         * Several recipes produce this item and one was chosen.
         *
         * 105 items of 13,065 have more than one, almost always the same
         * ingredients under a different discipline. Saying so is cheaper than
         * pretending the choice did not happen.
         */
        public bool $recipeWasChosen = false,
    ) {}

    public function missing(): int
    {
        return max(0, $this->needed - $this->owned);
    }

    public function satisfied(): bool
    {
        return $this->missing() === 0;
    }

    public function craftable(): bool
    {
        return $this->recipeId !== null;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'item_id' => $this->itemId,
            'name' => $this->name,
            'rarity' => $this->rarity,
            'icon' => $this->icon,
            'needed' => $this->needed,
            'owned' => $this->owned,
            'missing' => $this->missing(),
            'craftable' => $this->craftable(),
            'disciplines' => $this->disciplines,
            'min_rating' => $this->minRating,
            'recipe_was_chosen' => $this->recipeWasChosen,
            'depth' => $this->depth,
            'children' => array_map(fn (RecipeNode $c) => $c->toArray(), $this->children),
        ];
    }
}
