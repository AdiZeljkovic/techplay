<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
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
                        /*
                         * The tier being bought, which is one past the last one
                         * paid for. Without it the sentence reads "tier 0 of 4"
                         * for a track nobody has started, which is arithmetic
                         * leaking into English.
                         */
                        'buying_tier' => $track->tiersPaid + 1,
                        'tiers' => $track->tiers(),
                        'point' => $track->nextTierCost() === 1 ? 'point' : 'points',
                    ],
                    /*
                     * No blocker, deliberately.
                     *
                     * A tier costs experience as well as points, and that is
                     * true of every tier on every track always — so as a blocker
                     * it is not information, it is a disclaimer, and it was
                     * costing this rule thirty per cent of its score against one
                     * that simply says "you have points". A caveat that applies
                     * to everything belongs in the sentence, not in the ranking.
                     */
                    blockers: [],
                    // Same goal as the plain unspent-points rule, so the two
                    // cannot both fill the board.
                    pushes: ['mastery:'.$region->region],
                );
            }
        }

        return $signals;
    }
}
