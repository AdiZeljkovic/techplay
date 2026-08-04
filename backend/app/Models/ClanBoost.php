<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class ClanBoost extends Model
{
    protected $fillable = ['clan_id', 'key', 'starts_at', 'ends_at', 'activated_by'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime'];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    /**
     * Active boost keys for a clan, cached for a minute — read on every
     * earn, so it must cost nearly nothing.
     *
     * @return string[]
     */
    public static function activeKeys(int $clanId): array
    {
        return Cache::remember(
            "clan.boosts.{$clanId}",
            60,
            fn () => static::where('clan_id', $clanId)->where('ends_at', '>', now())->pluck('key')->all()
        );
    }

    public static function forgetActive(int $clanId): void
    {
        Cache::forget("clan.boosts.{$clanId}");
    }
}
