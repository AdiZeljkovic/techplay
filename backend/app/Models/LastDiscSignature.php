<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LastDiscSignature extends Model
{
    protected $fillable = [
        'user_id', 'email', 'name', 'country', 'display', 'message', 'wants_updates',
    ];

    // The address is the one thing here nobody but us should ever read back.
    protected $hidden = ['email'];

    protected $casts = ['wants_updates' => 'boolean'];
}
