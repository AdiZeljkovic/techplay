<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClanActivity extends Model
{
    protected $fillable = ['clan_id', 'user_id', 'type', 'title', 'meta'];

    protected $casts = ['meta' => 'array'];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
