<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlaySession extends Model
{
    /** The moods a session can carry — a closed set, so they can be styled. */
    public const MOODS = ['hooked', 'relaxed', 'grinding', 'frustrated', 'impressed', 'bored', 'emotional'];

    protected $fillable = [
        'user_id', 'game_id', 'played_on', 'minutes', 'platform',
        'progress_label', 'progress_percent', 'note', 'mood',
        'companions', 'has_spoilers', 'is_private',
    ];

    protected $casts = [
        'played_on' => 'date',
        'minutes' => 'integer',
        'progress_percent' => 'integer',
        'companions' => 'array',
        'has_spoilers' => 'boolean',
        'is_private' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function moments(): HasMany
    {
        return $this->hasMany(GamingMoment::class);
    }
}
