<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BountyTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'reason',
        'reference', // idempotency key — see BountyService::award
        'balance_after',
    ];

    protected $casts = [
        'amount' => 'integer',
        'balance_after' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
