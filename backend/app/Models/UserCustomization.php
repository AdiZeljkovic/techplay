<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCustomization extends Model
{
    protected $fillable = [
        'user_id',
        'customization_id',
        'is_equipped',
        'acquired_via',
    ];

    protected $casts = [
        'is_equipped' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customization(): BelongsTo
    {
        return $this->belongsTo(Customization::class);
    }
}
