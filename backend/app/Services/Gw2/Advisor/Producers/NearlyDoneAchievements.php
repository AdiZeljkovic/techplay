<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\EasyWin;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;

/**
 * Achievements close enough to finish that saying so is worth something.
 *
 * The test account has 443 part-done achievements and sixteen past 80%, eight of
 * them a single step from done. That last group is the whole value of an advisor
 * over the game's own achievement panel: the panel can sort by category but not
 * by "you will finish this tonight".
 *
 * How close counts as close is the rule's business, through
 * `requires: [{path: 'achievements.one_step_away', ...}]` and the `remaining`
 * weight. This producer only knows how to find them and how to say which.
 */
class NearlyDoneAchievements implements Producer
{
    public const KEY = 'achievements.nearly_done';

    /**
     * How many to offer at once.
     *
     * The engine cuts to three plus three alternatives, but it cuts across every
     * domain. Handing it sixteen achievements would let one rule crowd out every
     * other recommendation an account has, which is how a tool ends up feeling
     * like it only knows about one thing.
     */
    private const MOST = 6;

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $signals = [];

        foreach (array_slice($snapshot->nearlyDone, 0, self::MOST) as $win) {
            // Nothing to say about an achievement whose name we do not have.
            // The catalogue is mirrored locally so this is rare, and when it
            // happens it means the catalogue is behind the game rather than that
            // the player has something interesting.
            if ($win->name === null) {
                continue;
            }

            $signals[] = new Signal(
                rule: $rule,
                subject: "achievement:{$win->id}",
                facts: [
                    'name' => $win->name,
                    'remaining' => $win->remaining(),
                    'current' => $win->current,
                    'max' => $win->max,
                    'step' => $win->remaining() === 1 ? 'step' : 'steps',
                    'requirement' => $win->requirement ?? '',
                ],
                blockers: $this->blockers($win),
                pushes: ['achievement_points'],
            );
        }

        return $signals;
    }

    /**
     * @return array<int, string>
     */
    private function blockers(EasyWin $win): array
    {
        /*
         * An unreviewed achievement is the honest blocker here.
         *
         * The catalogue carries 8,339 achievements and a good few are retired,
         * hidden, or reachable only during a festival that is not running. Until
         * somebody has looked at a row, "you are one step away" might be one step
         * that cannot currently be taken, and saying so is better than either
         * hiding the advice or overstating it.
         */
        return $win->curated ? [] : ['Not yet checked by us — some achievements are seasonal or retired.'];
    }
}
