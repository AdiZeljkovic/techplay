<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\MasteryTrack;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\RegionMastery;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * The mastery tier the account can buy right now.
 *
 * This is what "you have 16 unspent Heart of Thorns points" should have been
 * saying all along. The points figure on its own is a fact; this is the next
 * action, and the difference between them is the whole job of an advisor.
 *
 * It is only possible because the catalogue is mirrored locally. The per-tier
 * point costs live in `/v2/masteries`, which is forty rows of game data that
 * changes when the game does — and joining an account's progress against it is
 * three tables and no API call at all.
 *
 * The costs climb steeply, which is why this is per tier rather than per track:
 * Itzel Lore runs 1, 2, 3, 5, 8, 12, so sixteen spare points either finishes one
 * track's next tier four times over or most of one expensive one, and only the
 * tier cost says which.
 */
class MasteryTierToBuy implements Producer
{
    public const KEY = 'mastery.tier_affordable';

    /** One per region. The engine has other things to say than a shopping list. */
    private const PER_REGION = 1;

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $signals = [];

        /** @var RegionMastery $region */
        foreach ($snapshot->masteryRegions as $region) {
            if ($region->unspent() < 1) {
                continue;
            }

            foreach (array_slice($snapshot->affordableIn($region->region), 0, self::PER_REGION) as $track) {
                $signals[] = new Signal(
                    rule: $rule,
                    subject: "mastery_track:{$track->id}",
                    facts: [
                        'track' => $track->name,
                        'region' => $region->region,
                        'tier' => $track->nextTierName() ?: 'the next tier',
                        'cost' => $track->nextTierCost(),
                        'unspent' => $region->unspent(),
                        'left_over' => $region->unspent() - (int) $track->nextTierCost(),
                        'tiers_paid' => $track->tiersPaid,
                        'tiers' => $track->tiers(),
                        'point' => $track->nextTierCost() === 1 ? 'point' : 'points',
                    ],
                    blockers: $this->blockers($track),
                    // Same goal as the plain unspent-points rule, so the two
                    // cannot both fill the board — this one outranks it and the
                    // other becomes the fallback for a region with nothing
                    // affordable in it.
                    pushes: ['mastery:'.$region->region],
                );
            }
        }

        return $signals;
    }

    /**
     * @return array<int, string>
     */
    private function blockers(MasteryTrack $track): array
    {
        /*
         * A mastery tier costs experience as well as points, and whether this
         * account has enough of it is not in the API anywhere. Saying "you can
         * buy this now" would be the overstatement; naming the other cost is
         * true and lets the player check it themselves in a second.
         */
        return ['A tier also needs the track filled with experience — the points are only half of it.'];
    }
}
