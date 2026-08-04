<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An editor's ruling on a pair the aggregator could not settle alone.
 *
 * Stored against normalised titles rather than game ids, because the whole
 * point of a "these are the same game" ruling is that one of those games stops
 * existing straight afterwards.
 */
class GameMatchDecision extends Model
{
    protected $fillable = [
        'left_key',
        'right_key',
        'same_game',
        'decided_by',
    ];

    protected $casts = [
        'same_game' => 'boolean',
    ];

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
