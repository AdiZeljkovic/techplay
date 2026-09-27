<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Producers\AgonyGap;
use App\Services\Gw2\Advisor\Producers\GearGaps;
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
                $signal->score = $this->score($signal, $facts);
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
    private function score(Signal $signal, array $facts): float
    {
        $score = (float) $signal->rule->base_score;

        foreach ($signal->rule->weights ?? [] as $path => $weight) {
            // A weight may reference the signal's own facts or the account's.
            $value = $signal->facts[$path] ?? $facts[$path] ?? null;

            if (is_numeric($value)) {
                $score += (float) $weight * (float) $value;
            }
        }

        $score *= self::CERTAINTY[$signal->rule->confidence] ?? 1.0;

        if ($signal->blockers !== []) {
            $score *= self::BLOCKED;
        }

        return max(0.0, min(200.0, $score));
    }

    /**
     * One activity often pushes several goals.
     *
     * Two candidates are the same thing when their identity matches. Beyond that,
     * candidates that push the same goal are thinned to the best two, which is
     * what stops the answer being "replace your second ring, your first
     * accessory, and your second accessory" — three cards saying one thing.
     *
     * @param  array<int, Signal>  $candidates
     * @return array<int, Signal>
     */
    private function dedupe(array $candidates): array
    {
        $seen = [];
        $perGoal = [];
        $kept = [];

        usort($candidates, fn (Signal $a, Signal $b) => $b->score <=> $a->score);

        foreach ($candidates as $signal) {
            if (isset($seen[$signal->identity()])) {
                continue;
            }

            $goal = $signal->pushes[0] ?? $signal->rule->key;

            if (($perGoal[$goal] ?? 0) >= 2) {
                continue;
            }

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
         * One domain must not own the headline.
         *
         * The vault alone can produce five confident candidates, and they would
         * legitimately win on score every single time — leaving a dashboard that
         * says nothing about gear, masteries or achievements ever. Spreading the
         * top three across domains costs a little ranking accuracy and buys a
         * page that is about the account rather than about one endpoint.
         */
        $spread = [];
        $held = [];
        $domains = [];

        foreach ($signals as $signal) {
            if (count($spread) < self::HEADLINE && ! isset($domains[$signal->rule->domain])) {
                $domains[$signal->rule->domain] = true;
                $spread[] = $signal;

                continue;
            }

            $held[] = $signal;
        }

        return [...$spread, ...$held];
    }
}
