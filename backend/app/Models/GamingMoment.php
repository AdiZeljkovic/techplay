<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamingMoment extends Model
{
    protected $fillable = [
        'user_id', 'game_id', 'play_session_id', 'type',
        'path', 'url', 'provider', 'thumbnail_url',
        'caption', 'has_spoilers', 'is_private',
    ];

    protected $casts = [
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(PlaySession::class, 'play_session_id');
    }
}
