<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A Mystic Forge recipe, with where it came from and when somebody checked it.
 *
 * Used by the planner only with both — see the migration for why a draft must
 * never reach a plan.
 *
 * @property int $output_item_id
 * @property string $output_count
 * @property array<int, array{type: string, id: int, count: int}> $ingredients
 * @property string|null $source_url
 * @property \Illuminate\Support\Carbon|null $checked_at
 */
class Gw2ForgeRecipe extends Model
{
    protected $fillable = ['output_item_id', 'output_count', 'ingredients', 'source_url', 'source_label', 'checked_at', 'notes'];

    protected $casts = [
        'ingredients' => 'array',
        'checked_at' => 'datetime',
    ];
}
