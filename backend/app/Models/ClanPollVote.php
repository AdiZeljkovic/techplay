<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClanPollVote extends Model
{
    protected $fillable = ['clan_poll_id', 'user_id', 'option'];

    protected $casts = ['option' => 'integer'];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(ClanPoll::class, 'clan_poll_id');
    }
}
