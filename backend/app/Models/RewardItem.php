<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RewardItem extends Model
{
    public const TYPES = ['badge', 'frame', 'theme', 'perk', 'discount', 'physical'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'cost',
        'type',
        'image',
        'stock',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'cost' => 'integer',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }
}
