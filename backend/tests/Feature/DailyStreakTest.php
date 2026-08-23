<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\StreakService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * A streak has to behave like one everywhere — including before it is claimed.
 *
 * The claim itself was always right: claim yesterday and today continues it,
 * miss a day and it starts over. What `info()` reported was not. It read the
 * stored number straight off the row, so a streak that died four days ago
 * still announced itself as seven days long and promised the seven-day reward,
 * right up until the claim that silently reset it to one and paid the
 * first-day rate.
 */
class DailyStreakTest extends TestCase
{
    use RefreshDatabase;

    private function service(): StreakService
    {
        return app(StreakService::class);
    }

    /* ── the count itself ─────────────────────────────────────────────── */

    public function test_a_claim_the_day_after_continues_the_streak(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 1,
            'last_daily_claim' => now()->subDay(),
        ]);

        $result = $this->service()->claim($user);

        $this->assertSame(2, $result['streak']);
    }

    public function test_a_missed_day_starts_over(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 7,
            'last_daily_claim' => now()->subDays(3),
        ]);

        $result = $this->service()->claim($user);

        $this->assertSame(1, $result['streak']);
        $this->assertTrue($result['streak_broken']);
    }

    public function test_the_same_day_cannot_be_claimed_twice(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 3,
            'last_daily_claim' => now()->subMinutes(5),
        ]);

        $this->assertNull($this->service()->claim($user));
        $this->assertSame(3, $user->fresh()->daily_streak);
    }

    /**
     * Day boundaries are the reader's, not UTC's.
     *
     * The app runs on Europe/Sarajevo; claiming at half past midnight is a new
     * day for the person doing it, and would still be the previous day in UTC.
     */
    public function test_a_day_ends_at_local_midnight(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 4,
            'last_daily_claim' => Carbon::parse('2026-08-22 23:40:00', config('app.timezone')),
        ]);

        Carbon::setTestNow(Carbon::parse('2026-08-23 00:20:00', config('app.timezone')));

        $result = $this->service()->claim($user);

        Carbon::setTestNow();

        $this->assertSame(5, $result['streak'], 'Forty minutes later, and it is a new day where the reader lives.');
    }

    /* ── what the widget is told ──────────────────────────────────────── */

    public function test_a_live_streak_reports_itself_and_what_it_pays(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 4,
            'last_daily_claim' => now()->subDay(),
        ]);

        $info = $this->service()->info($user);

        $this->assertSame(4, $info['streak']);
        $this->assertFalse($info['claimed_today']);
        // Tomorrow is day five: 10 base, plus 5 for each day past the first.
        $this->assertSame(30, $info['next_bounty']);
        $this->assertTrue($info['at_risk'], 'Alive, unclaimed, and gone at midnight.');
    }

    /**
     * The bug this file exists for.
     */
    public function test_a_broken_streak_does_not_keep_announcing_itself(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 7,
            'last_daily_claim' => now()->subDays(4),
        ]);

        $info = $this->service()->info($user);

        $this->assertSame(0, $info['streak'], 'It ended four days ago; the widget should not still say seven.');
        // And the next claim pays the first-day rate, so that is what it promises.
        $this->assertSame(10, $info['next_bounty']);
        $this->assertFalse($info['at_risk'], 'Nothing left to lose.');
    }

    public function test_a_streak_claimed_today_is_not_at_risk(): void
    {
        $user = User::factory()->create([
            'daily_streak' => 3,
            'last_daily_claim' => now(),
        ]);

        $info = $this->service()->info($user);

        $this->assertSame(3, $info['streak']);
        $this->assertTrue($info['claimed_today']);
        $this->assertFalse($info['at_risk']);
    }

    public function test_somebody_who_never_claimed_starts_at_zero(): void
    {
        $user = User::factory()->create(['daily_streak' => 0, 'last_daily_claim' => null]);

        $info = $this->service()->info($user);

        $this->assertSame(0, $info['streak']);
        $this->assertSame(10, $info['next_bounty']);
        $this->assertFalse($info['at_risk']);
    }
}
