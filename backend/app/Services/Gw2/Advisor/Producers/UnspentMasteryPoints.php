<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\RegionMastery;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * Mastery points earned and sitting there.
 *
 * One signal per region, never an account total, because points do not move
 * between regions. The test account has 35 unspent across four regions — 16 of
 * them Heart of Thorns, 11 Path of Fire, 7 Central Tyria, 1 Icebrood Saga. A
 * single "you have 35 unspent points" would be true and useless: it does not say
 * which masteries they can buy, and the answer is different in each region.
 */
class UnspentMasteryPoints implements Producer
{
    public const KEY = 'mastery.unspent_by_region';

    /**
     * Below this a region is not worth a card.
     *
     * One spare point is the resting state of almost every account — masteries
     * cost more than one — so surfacing it would put a permanent, unactionable
     * item on the dashboard.
     */
    private const WORTH_MENTIONING = 2;

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $signals = [];

        /** @var RegionMastery $region */
        foreach ($snapshot->masteryRegions as $region) {
            if ($region->unspent() < self::WORTH_MENTIONING) {
                continue;
            }

            $signals[] = new Signal(
                rule: $rule,
                subject: 'region:'.$region->region,
                facts: [
                    'region' => $region->region,
                    'unspent' => $region->unspent(),
                    'earned' => $region->earned,
                    'spent' => $region->spent,
                    'point' => $region->unspent() === 1 ? 'point' : 'points',
                ],
                /*
                 * No blocker is claimed even though one often exists: a mastery
                 * track also costs experience, and whether this account has
                 * enough is not in the API anywhere. Saying "you can buy this
                 * now" would be the invention; saying "these are spendable" is
                 * what the data supports.
                 */
                blockers: [],
                pushes: ['mastery:'.$region->region],
            );
        }

        return $signals;
    }
}
