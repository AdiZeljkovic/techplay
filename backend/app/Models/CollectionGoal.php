<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionGoal extends Model
{
    protected $fillable = ['user_id', 'type', 'target'];

    protected $casts = ['target' => 'integer'];

    /**
     * The three things a collection can be aimed at. Each one is measurable
     * from data we already keep, which is the whole test for adding another:
     * if progress can't be read live, it isn't a goal, it's a wish.
     */
    public const TYPES = ['complete_games', 'unlock_achievements', 'shrink_backlog'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
