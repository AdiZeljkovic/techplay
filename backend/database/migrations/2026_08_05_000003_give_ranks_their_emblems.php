<?php

use App\Models\Rank;
use Illuminate\Database\Migrations\Migration;

/**
 * Points each rank at its emblem.
 *
 * The ladder has twenty rungs and the artwork arrived as twenty files, but four
 * of them are named for what the tier is rather than what we call it — the
 * lowest two and the highest two. They are matched by position, which is what
 * a ladder is, rather than by a name lookup that would silently miss.
 */
return new class extends Migration
{
    /** In ladder order, lowest first. */
    private const EMBLEMS = [
        'Noob' => 'newcomer',
        'Newbie' => 'player',
        'Rookie' => 'rookie',
        'Bronze' => 'bronze',
        'Silver' => 'silver',
        'Gold' => 'gold',
        'Platinum' => 'platinum',
        'Diamond' => 'diamond',
        'Master' => 'master',
        'Grandmaster' => 'grandmaster',
        'Challenger' => 'challenger',
        'Elite' => 'elite',
        'Veteran' => 'veteran',
        'Legendary' => 'legend',
        'Mythic' => 'mythic',
        'Immortal' => 'immortal',
        'Radiant' => 'radiant',
        'Global Elite' => 'apex',
        'Ascendant' => 'ascendant',
        'God of Gaming' => 'eternal',
    ];

    public function up(): void
    {
        foreach (self::EMBLEMS as $rank => $emblem) {
            Rank::where('name', $rank)->update(['icon' => "/ranks/{$emblem}.webp"]);
        }
    }

    public function down(): void
    {
        Rank::whereIn('name', array_keys(self::EMBLEMS))->update(['icon' => null]);
    }
};
