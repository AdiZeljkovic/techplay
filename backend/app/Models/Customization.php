<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customization extends Model
{
    public const TYPES = ['theme', 'frame', 'badge', 'perk'];

    public const EQUIPPABLE = ['theme', 'frame', 'badge'];

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'cost',
        'required_tier',
        'value',
        'asset',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'cost' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_customizations')
            ->withPivot(['is_equipped', 'acquired_via'])
            ->withTimestamps();
    }
}
