<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

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

    public function clanTrophies(): HasMany
    {
        return $this->hasMany(ClanTrophy::class);
    }

    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }

    /** Cached id of the active season (null when none). */
    public static function activeId(): ?int
    {
        return Cache::remember('season.active_id.v1', 300, fn () => static::active()?->id) ?: null;
    }

    /**
     * Cached XP/bounty multipliers of the active season (1.0 when none).
     * Used by XpService/BountyService so seasonal boosts actually apply.
     */
    public static function multipliers(): array
    {
        return Cache::remember('season.multipliers.v1', 300, function () {
            $season = static::active();

            $xp = $season && (float) $season->xp_multiplier > 0 ? (float) $season->xp_multiplier : 1.0;
            $bounty = $season && (float) $season->bounty_multiplier > 0 ? (float) $season->bounty_multiplier : 1.0;

            return ['xp' => $xp, 'bounty' => $bounty];
        });
    }
}
