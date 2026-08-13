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
        // Written by SyncSteamLibrary and PresenceService only.
        'playtime_minutes',
        'playtime_source',
        // What the last Steam sync reported. The difference between this and
        // the next reading is what SessionSuggestionService proposes as a
        // session, so it is a floor rather than a fact about the game.
        'playtime_seen_minutes',
        'notify_on_release',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'from_backlog' => 'boolean',
        'playtime_minutes' => 'integer',
        'playtime_seen_minutes' => 'integer',
        'notify_on_release' => 'boolean',
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
