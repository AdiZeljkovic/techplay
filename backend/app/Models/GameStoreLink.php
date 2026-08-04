<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One game as one store lists it.
 *
 * This is what stops the aggregator from re-guessing itself: a game is matched
 * to a store listing once, and from then on every sync finds it by store id.
 */
class GameStoreLink extends Model
{
    protected $fillable = [
        'game_id',
        'store',
        'store_id',
        'url',
        'payload',
        'last_synced_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
