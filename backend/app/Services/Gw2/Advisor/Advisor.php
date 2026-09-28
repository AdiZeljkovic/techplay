<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Producers\AgonyGap;
use App\Services\Gw2\Advisor\Producers\GearGaps;
use App\Services\Gw2\Advisor\Producers\MasteryTierToBuy;
use App\Services\Gw2\Advisor\Producers\NearlyDoneAchievements;
use App\Services\Gw2\Advisor\Producers\UnclaimedAcclaim;
use App\Services\Gw2\Advisor\Producers\UnspentMasteryPoints;
use App\Services\Gw2\Advisor\Producers\VaultObjectives;
use Illuminate\Support\Facades\Log;

/**
 * Rules in, three recommendations and three alternatives out.
 *
 * The order of the steps is the design, not an implementation detail. Filtering
 * before producing is what keeps the cost down; deduplicating before cutting is
 * what stops one rule owning the whole answer; and cutting last is what makes the
 * top three actually the top three rather than the first three that matched.
 *
 * Nothing here calls ArenaNet and nothing here is cached, because there is
 * nothing expensive to cache: it reads a snapshot that a queued job wrote hours
 * ago and a rule table of a few dozen rows.
 */
class Advisor
{
    /** How many the caller gets. Both halves are deliberate. */
    public const HEADLINE = 3;

    public const ALTERNATIVES = 3;

    /**
     * Confidence as a multiplier on score.
     *
     * A confident small thing should beat a speculative big one, and this is
     * where that is enforced rather than left to each rule's base score. The
     * weakest level still scores above zero: advice worded as a question is worth
     * showing, or it would not have a confidence level at all.
     */
    private const CERTAINTY = [
        'confirmed' => 1.3,
        'high' => 1.15,
        'medium' => 1.0,
        'needs_confirmation' => 0.6,
    ];

    /**
     * What a matching goal is worth.
     *
     * §8.2 of the working document makes goal relevance the largest single
     * component of a recommendation's score — 0–35, ahead of blocker removal at
     * 0–25 — and the reasoning is sound: somebody who has said "I am working
     * towards fractals" has told us more than any inference we could make from
     * their account.
     *
     * Added flat rather than scaled. A rule either advances the chosen goal or
     * it does not; there is no half-relevant.
     */
    private const GOAL_RELEVANCE = 35.0;

    /**
     * What an unresolved blocker costs.
     *
     * A penalty, not an exclusion. "This needs ascended gear first" is often the
     * most useful sentence on the page — it just should not outrank something the
     * player can go and do right now.
     */
    private const BLOCKED = 0.7;

    /** @var array<string, class-string<Producer>> */
    private const PRODUCERS = [
        NearlyDoneAchievements::KEY => NearlyDoneAchievements::class,
        MasteryTierToBuy::KEY => MasteryTierToBuy::class,
        UnspentMasteryPoints::KEY => UnspentMasteryPoints::class,
        GearGaps::KEY => GearGaps::class,
        AgonyGap::KEY => AgonyGap::class,
        VaultObjectives::KEY => VaultObjectives::class,
        UnclaimedAcclaim::KEY => UnclaimedAcclaim::class,
    ];

    /**
     * @return array{headline: array<int, array<string, mixed>>, alternatives: array<int, array<string, mixed>>, considered: int}
     */
    public function advise(Snapshot $snapshot, ?Intent $intent = null): array
    {
        $intent ??= new Intent;
        $facts = Facts::from($snapshot);

        $candidates = [];

        foreach ($this->rules() as $rule) {
            if (! $this->applies($rule, $intent, $facts, $snapshot)) {
                continue;
            }

            foreach ($this->produce($rule, $snapshot, $intent) as $signal) {
                $signal->score = $this->score($signal, $facts, $intent->goal);
                $candidates[] = $signal;
            }
        }

        $considered = count($candidates);
        $ranked = $this->rank($this->dedupe($candidates));

        return [
            'headline' => array_map(
                fn (Signal $s) => $s->toArray(),
                array_slice($ranked, 0, self::HEADLINE)
            ),
            'alternatives' => array_map(
                fn (Signal $s) => $s->toArray(),
                array_slice($ranked, self::HEADLINE, self::ALTERNATIVES)
            ),
            // Not for display. It is how anybody looking at a thin dashboard can
            // tell "no rules matched" apart from "everything matched and the cut
            // was harsh".
            'considered' => $considered,
        ];
    }

    /** @return iterable<Gw2Rule> */
    private function rules(): iterable
    {
        return Gw2Rule::query()->active()->orderByDesc('base_score')->get();
    }

    /**
     * @param  array<string, int|float|bool|string|null>  $facts
     */
    private function applies(Gw2Rule $rule, Intent $intent, array $facts, Snapshot $snapshot): bool
    {
        if ($intent->rejects($rule->domain)) {
            return false;
        }

        if ($rule->effort_band && ! in_array($rule->effort_band, $intent->bandsThatFit(), true)) {
            return false;
        }

        /*
         * Expansion gating lives here rather than in each rule's `requires` so
         * it cannot be forgotten when somebody adds a rule. It also runs against
         * the resolved expansion list, not the raw `access` field — the test
         * account's `access` omits Heart of Thorns while holding forty earned
         * Heart of Thorns mastery points, so gating on the field directly would
         * hide advice from a player who can act on it.
         */
        if ($rule->needs_expansion && ! $snapshot->canReach($rule->needs_expansion)) {
            return false;
        }

        return Facts::satisfied($rule->requires, $facts);
    }

    /** @return array<int, Signal> */
    private function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $class = self::PRODUCERS[$rule->producer] ?? null;

        if (! $class) {
            /*
             * A rule naming a producer that does not exist is an editing mistake,
             * and the cost of it is silence — which is exactly the failure mode
             * nobody notices. One log line is what makes it findable.
             */
            Log::channel('connections')->warning('GW2 rule names an unknown producer', [
                'rule' => $rule->key,
                'producer' => $rule->producer,
            ]);

            return [];
        }

        return app($class)->produce($rule, $snapshot, $intent);
    }

    /**
     * Bounded on purpose.
     *
     * Every weight is a multiplier against a fact the rule names, and the result
     * is clamped. Without a ceiling a single large number — 443 part-done
     * achievements, 800 distinct items — would swamp every other consideration,
     * and the ranking would stop being about relevance and start being about
     * whichever fact happened to be biggest.
     *
     * @param  array<string, int|float|bool|string|null>  $facts
     */
    private function score(Signal $signal, array $facts, ?string $goal): float
    {
        $score = (float) $signal->rule->base_score;

        foreach ($signal->rule->weights ?? [] as $path => $weight) {
            // A weight may reference the signal's own facts or the account's.
            $value = $signal->facts[$path] ?? $facts[$path] ?? null;

            if (is_numeric($value)) {
                $score += (float) $weight * (float) $value;
            }
        }

        /*
         * Before the certainty multiplier, deliberately. A confident rule that
         * serves the chosen goal should beat a confident one that does not, and
         * multiplying the bonus would make an uncertain relevant rule score
         * higher than a certain relevant one at some weights.
         */
        if ($goal !== null && in_array($goal, $signal->rule->goals ?? [], true)) {
            $score += self::GOAL_RELEVANCE;
        }

        $score *= self::CERTAINTY[$signal->rule->confidence] ?? 1.0;

        if ($signal->blockers !== []) {
            $score *= self::BLOCKED;
        }

        return max(0.0, min(200.0, $score));
    }

    /**
     * One activity often pushes several goals, and one subject often has several
     * rules with something to say about it.
     *
     * Three passes, and each one closed a duplicate that reached a real reader
     * during development:
     *
     * **By subject.** Two rules share the achievements producer at different
     * thresholds, so "Finish Auric Basin Explorer — 1 step left" and "Close on
     * Auric Basin Explorer" are the same achievement described twice. Only the
     * better-scoring one survives.
     *
     * **By identity.** The same rule reaching the same subject twice, which a
     * producer should not do but is cheap to defend against.
     *
     * **By goal, capped at two.** What stops the answer being "replace your
     * second ring, your first accessory, and your second accessory" — three
     * cards saying one thing.
     *
     * @param  array<int, Signal>  $candidates
     * @return array<int, Signal>
     */
    private function dedupe(array $candidates): array
    {
        usort($candidates, fn (Signal $a, Signal $b) => $b->score <=> $a->score);

        $bySubject = [];
        $seen = [];
        $perGoal = [];
        $kept = [];

        foreach ($candidates as $signal) {
            if (isset($bySubject[$signal->subject]) || isset($seen[$signal->identity()])) {
                continue;
            }

            $goal = $signal->pushes[0] ?? $signal->rule->key;

            if (($perGoal[$goal] ?? 0) >= 2) {
                continue;
            }

            $bySubject[$signal->subject] = true;
            $seen[$signal->identity()] = true;
            $perGoal[$goal] = ($perGoal[$goal] ?? 0) + 1;
            $kept[] = $signal;
        }

        return $kept;
    }

    /**
     * @param  array<int, Signal>  $signals
     * @return array<int, Signal>
     */
    private function rank(array $signals): array
    {
        usort($signals, fn (Signal $a, Signal $b) => [$b->score, $a->rule->key] <=> [$a->score, $b->rule->key]);

        /*
         * Round-robin across domains, not just for the headline.
         *
         * Spreading only the top three was not enough, and the test account
         * showed exactly why: the vault and the mastery regions legitimately won
         * on score, filled the headline and then filled all three alternatives
         * too, so eight achievements a single step from finishing — the most
         * actionable thing on the account — never appeared anywhere.
         *
         * Taking the best remaining candidate from a different domain each time
         * costs some ranking accuracy in exchange for six recommendations that
         * are about the account rather than about two endpoints. Within a domain
         * the score order is untouched, and once every domain has been drawn from
         * the cycle starts again, so nothing is dropped — only reordered.
         */
        $byDomain = [];

        foreach ($signals as $signal) {
            $byDomain[$signal->rule->domain][] = $signal;
        }

        $ordered = [];

        while ($byDomain !== []) {
            // Best-first among the domains still holding something, so the
            // strongest candidate of the round leads it.
            uasort($byDomain, fn ($a, $b) => $b[0]->score <=> $a[0]->score);

            foreach (array_keys($byDomain) as $domain) {
                $ordered[] = array_shift($byDomain[$domain]);

                if ($byDomain[$domain] === []) {
                    unset($byDomain[$domain]);
                }
            }
        }

        return $ordered;
    }
}
