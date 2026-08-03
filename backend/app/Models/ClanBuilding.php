<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache as CacheFacade;

class ClanBuilding extends Model
{
    /** The eight buildings, in the order the base draws them. */
    public const KEYS = [
        'command_center', 'mission_control', 'training_grounds', 'vault',
        'trophy_hall', 'archive', 'workshop', 'communications_hub',
    ];

    protected $fillable = ['clan_id', 'key', 'level'];

    protected $casts = ['level' => 'integer'];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    /**
     * Building levels for a clan, cached briefly — read on every resource
     * credit (vault capacity, training bonus), so it must stay cheap.
     *
     * @return array<string,int>
     */
    public static function levelsFor(int $clanId): array
    {
        return CacheFacade::remember(
            "clan.buildings.{$clanId}",
            300,
            fn () => static::where('clan_id', $clanId)->pluck('level', 'key')->all()
        );
    }
}
