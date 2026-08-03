<?php

namespace App\Services;

use App\Models\BountyTransaction;
use App\Models\User;

/**
 * The reward ladder — twelve rungs climbed with bounty *earned*, never bounty
 * held. A tier that fell every time you spent would punish using the store,
 * which is the one thing the store exists for.
 *
 * Distinct from `customizations.required_tier`, which gates a handful of items
 * behind the paid supporter tier. That one is bought; this one is played for.
 */
class RewardTierService
{
    /** @var array<int,array{0:string,1:string,2:int}> [family, numeral, lifetime earned needed] */
    private const LADDER = [
        ['Bronze', 'I', 0],
        ['Bronze', 'II', 250],
        ['Bronze', 'III', 500],
        ['Silver', 'I', 1000],
        ['Silver', 'II', 1750],
        ['Silver', 'III', 2500],
        ['Gold', 'I', 3500],
        ['Gold', 'II', 5000],
        ['Gold', 'III', 7000],
        ['Platinum', 'I', 10000],
        ['Platinum', 'II', 14000],
        ['Platinum', 'III', 20000],
    ];

    private const COLORS = [
        'Bronze' => '#cd7f32',
        'Silver' => '#c0c0c0',
        'Gold' => '#f0b429',
        'Platinum' => '#67e8f9',
    ];

    /**
     * Lifetime totals straight off the ledger — the balance alone can't tell
     * you whether someone earned 200 or earned 12,000 and spent 11,800.
     *
     * @return array{earned:int,spent:int}
     */
    public function lifetime(User $user): array
    {
        $rows = BountyTransaction::where('user_id', $user->id)
            ->selectRaw('sum(case when amount > 0 then amount else 0 end) as earned')
            ->selectRaw('sum(case when amount < 0 then -amount else 0 end) as spent')
            ->first();

        return [
            'earned' => (int) ($rows->earned ?? 0),
            'spent' => (int) ($rows->spent ?? 0),
        ];
    }

    /**
     * Where this user stands, and what the next rung costs.
     */
    public function standing(int $lifetimeEarned): array
    {
        $index = 0;
        foreach (self::LADDER as $i => [, , $needed]) {
            if ($lifetimeEarned >= $needed) {
                $index = $i;
            }
        }

        [$family, $numeral, $floor] = self::LADDER[$index];
        $next = self::LADDER[$index + 1] ?? null;

        return [
            'name' => $family.' '.$numeral,
            'family' => $family,
            'numeral' => $numeral,
            'color' => self::COLORS[$family],
            'level' => $index + 1,
            'max_level' => count(self::LADDER),
            'floor' => $floor,
            'next' => $next ? ['name' => $next[0].' '.$next[1], 'at' => $next[2]] : null,
            'progress' => $next
                ? min(100, (int) round((($lifetimeEarned - $floor) / max(1, $next[2] - $floor)) * 100))
                : 100,
            'remaining' => $next ? max(0, $next[2] - $lifetimeEarned) : 0,
        ];
    }

    /** The whole ladder, for the "View tiers" panel. */
    public function ladder(): array
    {
        return collect(self::LADDER)->map(fn (array $rung, int $i) => [
            'name' => $rung[0].' '.$rung[1],
            'family' => $rung[0],
            'color' => self::COLORS[$rung[0]],
            'level' => $i + 1,
            'at' => $rung[2],
        ])->all();
    }
}
