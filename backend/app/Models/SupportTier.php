<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTier extends Model
{
    protected $fillable = [
        'name',
        'price',
        'paypal_plan_id',
        'currency',
        'features',
        'color',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
    ];
}
