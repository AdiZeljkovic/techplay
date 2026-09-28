<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\AchievementStep;
use App\Services\Gw2\Advisor\EasyWin;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\MasteryRegions;
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
        $needed = $this->regionsWherePointsWouldHelp($snapshot);

        foreach (array_slice($this->masteryFirst($snapshot->nearlyDone, $needed), 0, self::MOST) as $win) {
            // Nothing to say about an achievement whose name we do not have.
            // The catalogue is mirrored locally so this is rare, and when it
            // happens it means the catalogue is behind the game rather than that
            // the player has something interesting.
            if ($win->name === null) {
                continue;
            }

            $region = MasteryRegions::toAccountName($win->masteryRegion);
            $wanted = $region !== null && in_array($region, $needed, true);
            $left = $win->remainingSteps();

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
                    // The game's words for the next thing to do, falling back
                    // to the achievement's own requirement line where it has
                    // no step list. Always populated, so the rule body needs
                    // no conditional.
                    'next_step' => $this->nextStep($win, $left),
                    // Empty unless the point lands somewhere it is wanted. A
                    // rule that reads "{mastery_note}" then renders nothing,
                    // which is the behaviour to want from a fact that only
                    // sometimes applies.
                    'mastery_note' => $wanted
                        ? " It also pays a {$region} mastery point, and you have {$region} tracks that are short of points."
                        : '',
                    'mastery_region' => $region ?? '',
                ],
                blockers: $this->blockers($win),
                pushes: $wanted ? ['achievement_points', 'masteries'] : ['achievement_points'],
                details: array_filter([
                    'icon' => $win->icon,
                    ...($win->stepsKnown() ? [
                        'steps_total' => count($win->steps),
                        'steps_remaining' => array_map(fn (AchievementStep $s) => [
                            'index' => $s->index,
                            'text' => $s->text,
                        ], $left),
                    ] : []),
                ]),
            );
        }

        return $signals;
    }

    /**
     * The next thing to do, in the game's own words where it has any.
     *
     * @param  array<int, AchievementStep>  $left
     */
    private function nextStep(EasyWin $win, array $left): string
    {
        foreach ($left as $step) {
            if ($step->text === null) {
                continue;
            }

            /*
             * Some step text is a sentence — "Somewhere in Necrotic Coast." —
             * and some is a bare label, "Morwood Wilds". Dropped straight into
             * a rule body the second reads as a sentence fragment stuck to the
             * end of the previous one. The lead-in makes both read, and the
             * full stop is added only where the game left one off.
             */
            return 'Next: '.rtrim($step->text, '.').'.';
        }

        /*
         * No named step, so the achievement's requirement line is the best
         * sentence available. That is not a degraded case — plenty of
         * achievements are a single counter with no steps at all, and for
         * those the requirement *is* the instruction.
         */
        return $win->requirement ?? '';
    }

    /**
     * §12.1, which asks for one thing and is worth quoting exactly:
     *
     * > *"Boost achievements that award a Mastery Point needed by the user's
     * > currently selected region/goal."*
     *
     * "Needed" is doing the work, and the obvious reading of it is wrong. An
     * account with 31 unspent Path of Fire points does not need another one;
     * handing it a mastery-point achievement would be advice that changes
     * nothing. A point is needed where the region still has a track to train
     * **and** the unspent points do not already cover the cheapest next tier —
     * that is, where the point is the thing standing in the way.
     *
     * Applied before the cut rather than after it, because a boost that only
     * reorders the six already on screen cannot lift the seventh onto it, and
     * lifting is the entire request.
     *
     * @param  array<int, EasyWin>  $wins
     * @param  array<int, string>  $needed
     * @return array<int, EasyWin>
     */
    private function masteryFirst(array $wins, array $needed): array
    {
        if ($needed === []) {
            return $wins;
        }

        $lifted = [];
        $rest = [];

        foreach ($wins as $win) {
            $region = MasteryRegions::toAccountName($win->masteryRegion);

            if ($region !== null && in_array($region, $needed, true)) {
                $lifted[] = $win;
            } else {
                $rest[] = $win;
            }
        }

        /*
         * Order within each half is untouched. The reader already sorted by
         * closest-to-done, and that is still the right tiebreak — this moves
         * a group, it does not re-rank inside one.
         */
        return [...$lifted, ...$rest];
    }

    /**
     * Regions where one more mastery point would actually unblock something.
     *
     * @return array<int, string>
     */
    private function regionsWherePointsWouldHelp(Snapshot $snapshot): array
    {
        $cheapest = [];

        foreach ($snapshot->masteryTracks as $track) {
            if ($track->region === null || $track->finished()) {
                continue;
            }

            $cost = $track->nextTierCost();

            if ($cost === null) {
                continue;
            }

            $cheapest[$track->region] = min($cheapest[$track->region] ?? PHP_INT_MAX, $cost);
        }

        $needed = [];

        foreach ($cheapest as $region => $cost) {
            $unspent = ($snapshot->masteryRegions[$region] ?? null)?->unspent() ?? 0;

            if ($unspent < $cost) {
                $needed[] = $region;
            }
        }

        return $needed;
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
