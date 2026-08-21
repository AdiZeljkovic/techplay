<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Somewhere to buy a game, or somewhere it lives online.
 *
 * Not `GameStoreLink`, which is the release aggregator's own ingest record and
 * carries meaning this does not — the aggregator scores games by counting it
 * and admits them to the release calendar by it.
 */
class GameLink extends Model
{
    protected $fillable = ['game_id', 'kind', 'service', 'url'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
