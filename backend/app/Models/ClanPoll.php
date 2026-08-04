<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClanPoll extends Model
{
    protected $fillable = ['clan_id', 'question', 'options', 'ends_at', 'created_by'];

    protected $casts = ['options' => 'array', 'ends_at' => 'datetime'];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ClanPollVote::class);
    }
}
