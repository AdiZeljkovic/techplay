<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Wiki;

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
        /**
         * For a recipe taught by a sheet: whether this account has learned
         * it. Null when the recipe comes with the discipline, or when the
         * account's recipes were not read.
         */
        public ?bool $recipeLearned = null,
        /**
         * Made in the Mystic Forge, from a checked recipe: its source, when it
         * was checked, whether the forge is random for it, and how many
         * attempts the plan is for. Null for everything else.
         *
         * @var array<string, mixed>|null
         */
        public ?array $forge = null,
        /** A wallet currency rather than an item. `itemId` is 0 then. */
        public ?int $currencyId = null,
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
        return $this->recipeId !== null || $this->forge !== null;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'item_id' => $this->itemId,
            'currency_id' => $this->currencyId,
            'name' => $this->name,
            'rarity' => $this->rarity,
            'icon' => $this->icon,
            'wiki' => $this->currencyId === null ? Wiki::item($this->itemId) : null,
            'forge' => $this->forge,
            'needed' => $this->needed,
            'owned' => $this->owned,
            'missing' => $this->missing(),
            'craftable' => $this->craftable(),
            'disciplines' => $this->disciplines,
            'min_rating' => $this->minRating,
            'recipe_was_chosen' => $this->recipeWasChosen,
            'recipe_learned' => $this->recipeLearned,
            'depth' => $this->depth,
            'children' => array_map(fn (RecipeNode $c) => $c->toArray(), $this->children),
        ];
    }
}
