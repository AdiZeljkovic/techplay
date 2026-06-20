<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Season extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'cover_image', 'badge_image',
        'start_date', 'end_date', 'is_active', 'xp_multiplier', 'bounty_multiplier',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'xp_multiplier' => 'decimal:2',
        'bounty_multiplier' => 'decimal:2',
    ];

    public function quests(): HasMany
    {
        return $this->hasMany(Quest::class);
    }

    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }
}
