<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserGame extends Model
{
    public const STATUSES = ['playing', 'backlog', 'completed', 'wishlist', 'dropped'];

    protected $fillable = [
        'user_id',
        'game_id',
        'status',
        'is_favorite',
        'progress',
        'hours_played',
        'platform',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'progress' => 'integer',
        'hours_played' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
