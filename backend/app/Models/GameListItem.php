<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameListItem extends Model
{
    protected $fillable = [
        'game_list_id',
        'game_id',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function gameList(): BelongsTo
    {
        return $this->belongsTo(GameList::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
