<?php

namespace Tests\Feature;

use App\Services\Gw2\Advisor\SessionPlan;
use Tests\TestCase;

/**
 * An evening that fits, built from advice that already holds.
 *
 * The estimates behind it are editorial — the game reports the duration of
 * nothing — so the two things worth guarding are that a stated budget is never
 * overrun, and that a rule nobody has judged is treated as unknown rather than
 * as free.
 */
class Gw2SessionPlanTest extends TestCase
{
    public function test_a_stated_budget_is_never_overrun(): void
    {
        $plan = app(SessionPlan::class)->build([
            $this->candidate('a', 10, 20),
            $this->candidate('b', 25, 40),
            $this->candidate('c', 10, 15),
            $this->candidate('d', 15, 30),
        ], 30);

        /*
         * Filled with the low end of each range on purpose. An evening with time
         * left over is a good evening; one that needed ninety minutes was a plan
         * the player could not follow.
         */
        $this->assertSame(['a', 'c'], array_column($plan['steps'], 'key'));
        $this->assertSame(20, $plan['accounted_for']);
        $this->assertSame(10, $plan['unaccounted']);

        // Not rejected — below the line the budget drew, and still reachable.
        $this->assertSame(['b', 'd'], array_column($plan['if_you_have_longer'], 'key'));
    }

    public function test_a_rule_with_no_estimate_is_unknown_and_not_free(): void
    {
        $plan = app(SessionPlan::class)->build([
            $this->candidate('unjudged', null, null),
            $this->candidate('known', 25, 30),
        ], 30);

        $keys = array_column($plan['steps'], 'key');

        // Both are in the plan: the unjudged one takes its place in the order
        // without claiming a duration.
        $this->assertSame(['unjudged', 'known'], $keys);

        // And it costs nothing against the budget, because we do not know what
        // it costs. Defaulting it to ten would be the invention.
        $this->assertNull($plan['steps'][0]['starts_at']);
        $this->assertNull($plan['steps'][0]['costs']);
        $this->assertSame(25, $plan['accounted_for']);
    }

    public function test_with_no_budget_everything_keeps_its_order_and_nothing_is_scheduled(): void
    {
        $plan = app(SessionPlan::class)->build([
            $this->candidate('a', 10, 20),
            $this->candidate('b', 25, 40),
        ], null);

        $this->assertSame(['a', 'b'], array_column($plan['steps'], 'key'));
        $this->assertNull($plan['unaccounted']);

        // Nobody said how long they have, so nothing gets a clock beside it.
        $this->assertNull($plan['steps'][0]['starts_at']);
    }

    public function test_the_clock_runs_from_the_start_of_the_session(): void
    {
        $plan = app(SessionPlan::class)->build([
            $this->candidate('a', 10, 20),
            $this->candidate('b', 15, 25),
        ], 60);

        $this->assertSame(0, $plan['steps'][0]['starts_at']);
        $this->assertSame(10, $plan['steps'][1]['starts_at']);
    }

    public function test_a_plan_stops_being_a_plan_past_six_steps(): void
    {
        $candidates = [];

        for ($i = 0; $i < 10; $i++) {
            $candidates[] = $this->candidate("r{$i}", 1, 2);
        }

        $plan = app(SessionPlan::class)->build($candidates, 600);

        $this->assertCount(6, $plan['steps']);
        $this->assertCount(4, $plan['if_you_have_longer']);
    }

    /** @return array<string, mixed> */
    private function candidate(string $key, ?int $low, ?int $high): array
    {
        return [
            'key' => $key,
            'subject' => $key,
            'domain' => 'vault',
            'title' => ucfirst($key),
            'body' => 'because.',
            'confidence' => 'high',
            'effort' => 'quick',
            'blockers' => [],
            'minutes_low' => $low,
            'minutes_high' => $high,
        ];
    }
}
