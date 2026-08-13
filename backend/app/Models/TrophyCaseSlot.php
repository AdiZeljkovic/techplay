<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One shelf position in a reader's trophy case.
 *
 * Deliberately dumb: it knows which source and which key, not what the thing
 * is. Resolving a slot into a name and an icon is TrophyCaseService's job, so
 * a new platform costs a branch there rather than a schema change here.
 */
class TrophyCaseSlot extends Model
{
    /** How many a case holds. Five is the Steam showcase count, and it is right. */
    public const CAPACITY = 5;

    /** Sources a slot may point at. */
    public const SOURCES = ['techplay', 'steam'];

    protected $fillable = ['user_id', 'source', 'reference', 'position'];

    protected $casts = [
        'reference' => 'integer',
        'position' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
