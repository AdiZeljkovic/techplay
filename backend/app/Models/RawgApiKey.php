<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RawgApiKey extends Model
{
    protected $fillable = [
        'api_key',
        'label',
        'calls_used',
        'calls_limit',
        'reset_at',
        'is_active',
    ];

    protected $casts = [
        'calls_used'  => 'integer',
        'calls_limit' => 'integer',
        'is_active'   => 'boolean',
        'reset_at'    => 'datetime',
    ];
}
