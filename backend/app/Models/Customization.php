<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customization extends Model
{
    public const TYPES = ['theme', 'frame', 'badge', 'perk', 'post_color'];

    public const EQUIPPABLE = ['theme', 'frame', 'badge', 'post_color'];

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

    /**
     * Award-only cosmetics (season champion, campaign badges) are granted by
     * commands — never purchasable. Convention: free badge with no tier lock.
     */
    public function isAwardOnly(): bool
    {
        return $this->type === 'badge' && (int) $this->cost === 0 && ! $this->required_tier;
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_customizations')
            ->withPivot(['is_equipped', 'acquired_via'])
            ->withTimestamps();
    }
}
