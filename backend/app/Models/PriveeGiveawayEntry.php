<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriveeGiveawayEntry extends Model
{
    protected $fillable = [
        'giveaway_id',
        'privee_user_id',
        'privee_email',
        'privee_display_name',
        'access_token',
        'refresh_token',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'access_token'  => 'encrypted',
        'refresh_token' => 'encrypted',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    public function giveaway(): BelongsTo
    {
        return $this->belongsTo(Giveaway::class);
    }
}
