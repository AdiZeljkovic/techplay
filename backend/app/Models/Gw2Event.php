<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A world boss or meta event, and when it happens.
 *
 * Not from the API. `/v2/account/worldbosses` reports which ones an account
 * killed since the daily reset and never when the next one spawns; there is no
 * schedule endpoint anywhere. The times are real, fixed and published, and they
 * are external knowledge — so they are rows somebody enters and signs off,
 * not a timetable typed from memory.
 *
 * Nothing unverified reaches a reader. A wrong spawn time sends a player to an
 * empty map, which is worse than telling them nothing at all.
 *
 * @property string $name
 * @property array<int, int>|null $daily_times_utc Minutes past midnight UTC.
 */
class Gw2Event extends Model
{
    protected $fillable = [
        'name', 'slug', 'kind', 'region', 'waypoint',
        'daily_times_utc', 'duration_minutes', 'rewards',
        'is_published', 'verified_at', 'verified_source',
    ];

    protected $casts = [
        'daily_times_utc' => 'array',
        'is_published' => 'boolean',
        'verified_at' => 'datetime',
    ];

    /**
     * Published **and** verified. Both, always.
     *
     * Publishing says an editor meant it to be visible; verifying says somebody
     * checked it against the game. A row with only the first is a good intention
     * and a wrong answer.
     */
    public function scopeUsable(Builder $query): void
    {
        $query->where('is_published', true)->whereNotNull('verified_at');
    }
}
