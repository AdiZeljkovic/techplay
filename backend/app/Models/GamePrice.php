<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * What a game costs, so a shelf can say what it is worth.
 *
 * `full_cents` is the price before any sale. That is deliberately the figure
 * the library totals: a collection's worth should not drop by sixty dollars
 * because four of its games are discounted this week, and rise again on Monday.
 */
class GamePrice extends Model
{
    protected $fillable = [
        'game_id', 'status', 'currency', 'full_cents', 'final_cents',
        'discount_percent', 'source', 'fetched_at',
    ];

    protected $casts = [
        'full_cents' => 'integer',
        'final_cents' => 'integer',
        'discount_percent' => 'integer',
        'fetched_at' => 'datetime',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /** Rows that carry a number worth adding up. */
    public function scopeCounted($query)
    {
        return $query->whereIn('status', ['priced', 'free']);
    }
}
