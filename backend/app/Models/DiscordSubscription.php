<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscordSubscription extends Model
{
    protected $fillable = [
        'discord_id',
        'type',
        'subscribed_at',
    ];

    protected $casts = [
        'subscribed_at' => 'datetime',
    ];
}
