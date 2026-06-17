<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReputationSnapshot extends Model
{
    protected $fillable = [
        'user_id',
        'period',
        'reputation',
        'contribution_points',
    ];

    protected $casts = [
        'reputation' => 'integer',
        'contribution_points' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
