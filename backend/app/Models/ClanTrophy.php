<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClanTrophy extends Model
{
    protected $fillable = ['clan_id', 'key', 'title', 'description', 'season_id', 'meta', 'awarded_at'];

    protected $casts = ['meta' => 'array', 'awarded_at' => 'datetime'];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
