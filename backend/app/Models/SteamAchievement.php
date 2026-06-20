<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SteamAchievement extends Model
{
    protected $fillable = [
        'user_id',
        'game_id',
        'steam_appid',
        'api_name',
        'display_name',
        'description',
        'icon_url',
        'achieved',
        'achieved_at',
    ];

    protected $casts = [
        'achieved' => 'boolean',
        'achieved_at' => 'datetime',
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
