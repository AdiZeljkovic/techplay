<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSupport extends Model
{
    protected $fillable = [
        'user_id',
        'support_tier_id',
        'amount',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tier()
    {
        return $this->belongsTo(SupportTier::class, 'support_tier_id');
    }
}
