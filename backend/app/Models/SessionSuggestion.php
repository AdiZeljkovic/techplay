<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionSuggestion extends Model
{
    /**
     * Below this, it is noise.
     *
     * Steam counts a launch that got as far as the main menu, and an eight
     * minute reading is not a session anybody wants to be asked about. Above
     * it, the reader decides.
     */
    public const MIN_MINUTES = 15;

    /**
     * Above this, something is wrong with the reading rather than remarkable.
     *
     * A first sync sees a lifetime total, and an account reconnected after a
     * year would otherwise be offered "you played for 300 hours yesterday".
     * Anything past a long day is dropped rather than proposed.
     */
    public const MAX_MINUTES = 16 * 60;

    protected $fillable = ['user_id', 'game_id', 'minutes', 'source', 'played_on', 'status'];

    protected $casts = [
        'minutes' => 'integer',
        'played_on' => 'date',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
