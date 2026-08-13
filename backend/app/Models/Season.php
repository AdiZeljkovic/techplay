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

    public static function active(): ?self
    {
        // The dates matter, not just the flag. `is_active` is flipped off by
        // the nightly season:conclude run, so a season whose end_date has
        // passed stays "active" until that runs — and if the scheduler is down,
        // stays active indefinitely, still applying its XP and bounty
        // multipliers. Reading the dates makes the season end when it says it
        // ends, and leaves the command to do the awarding.
        return static::where('is_active', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()))
            // Newest first, not lowest id. Two overlapping active seasons is a
            // data mistake an admin can make in thirty seconds, and resolving
            // it by id meant the older one silently won — which is how
            // "Season 1: Ignition" spent six weeks invisible underneath
            // "Summer of Gaming 2026". If it ever happens again, the season
            // that started most recently is the one people think they are in.
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * The season still carrying the `is_active` flag, running or not.
     *
     * What season:conclude needs: it exists precisely to close a season whose
     * end date has passed, so it cannot use active(), which now excludes it.
     */
    public static function flaggedActive(): ?self
    {
        return static::where('is_active', true)->orderBy('id')->first();
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
