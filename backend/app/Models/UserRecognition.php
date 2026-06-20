<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRecognition extends Model
{
    public $timestamps = false;

    protected $fillable = ['giver_id', 'receiver_id', 'type'];

    public $guarded = [];

    public function giver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'giver_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
