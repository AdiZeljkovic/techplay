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
        'showcase_order',
        'progress',
        'hours_played',
        'platform',
        'started_at',
        'completed_at',
        'last_played_at',
        // Set by the controller on a backlog→completed transition; never
        // accepted from request input (the update validator whitelists fields).
        'from_backlog',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'from_backlog' => 'boolean',
        'showcase_order' => 'integer',
        'progress' => 'integer',
        'hours_played' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_played_at' => 'datetime',
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
