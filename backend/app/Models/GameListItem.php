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
        'note',
        'score',
    ];

    protected $casts = [
        'position' => 'integer',
        'score' => 'decimal:1',
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
