<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameListComment extends Model
{
    protected $fillable = ['game_list_id', 'user_id', 'body'];

    public function list(): BelongsTo
    {
        return $this->belongsTo(GameList::class, 'game_list_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
