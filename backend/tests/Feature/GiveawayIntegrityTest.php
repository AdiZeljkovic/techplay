<?php

namespace Tests\Feature;

use App\Filament\Resources\GiveawayResource;
use App\Models\Giveaway;
use App\Models\GiveawayEntry;
use App\Models\GiveawayTask;
use App\Models\GiveawayTaskCompletion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P4 unit seven: giveaways.
 *
 * The draw itself was already careful — locked, idempotent, weighted. What was
 * not careful was everything that decides how many tickets somebody holds when
 * that draw happens.
 */
class GiveawayIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function giveaway(): Giveaway
    {
        return Giveaway::create([
            'title' => 'A keyboard',
            'slug' => 'a-keyboard',
            'description' => 'Mechanical, loud.',
            'prize_name' => 'Mechanical keyboard',
            'created_by' => User::factory()->create()->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addWeek(),
            'status' => 'active',
            'is_public' => true,
            'max_entries_per_user' => 1000,
        ]);
    }

    /** Somebody entered, which is what makes a draw owed at all. */
    private function withOneEntry(Giveaway $giveaway): Giveaway
    {
        GiveawayEntry::create([
            'giveaway_id' => $giveaway->id,
            'user_id' => User::factory()->create()->id,
            'total_points' => 10,
        ]);

        return $giveaway;
    }

    public function test_a_one_off_task_counts_once(): void
    {
        $user = User::factory()->create();
        $giveaway = $this->giveaway();

        $task = GiveawayTask::create([
            'giveaway_id' => $giveaway->id,
            'type' => 'visit_url',
            'title' => 'Visit the site',
            'points' => 25,
            'is_repeatable' => false,
        ]);

        $url = "/api/v1/giveaways/{$giveaway->slug}/tasks/{$task->id}/complete";

        $this->actingAs($user)->postJson($url)->assertSuccessful();
        $this->actingAs($user)->postJson($url)->assertStatus(422);
        $this->actingAs($user)->postJson($url)->assertStatus(422);

        $entry = GiveawayEntry::where('user_id', $user->id)->firstOrFail();

        $this->assertSame(25, (int) $entry->total_points);

        // completed_date is NULL for a one-off task, and Postgres treats NULLs
        // as distinct — so the unique index alone never stopped a second row.
        $this->assertSame(1, GiveawayTaskCompletion::where('entry_id', $entry->id)
            ->where('task_id', $task->id)->count());
    }

    public function test_a_referral_task_cannot_be_clicked_for_its_points(): void
    {
        // The points on a referral task are paid in enter(), once per person
        // who actually arrives on your link. The task is also a row in the list
        // like any other, and every other row is self-reported by the click —
        // so this one handed over its points before a single friend was asked.
        $user = User::factory()->create();
        $giveaway = $this->giveaway();

        $task = GiveawayTask::create([
            'giveaway_id' => $giveaway->id,
            'type' => 'referral',
            'title' => 'Invite a friend',
            'points' => 50,
        ]);

        $this->actingAs($user)
            ->postJson("/api/v1/giveaways/{$giveaway->slug}/tasks/{$task->id}/complete")
            ->assertStatus(422);

        $entry = GiveawayEntry::where('user_id', $user->id)->first();

        $this->assertSame(0, (int) ($entry?->total_points ?? 0));
        $this->assertSame(0, GiveawayTaskCompletion::where('task_id', $task->id)->count());
    }

    public function test_a_referral_pays_the_person_who_invited(): void
    {
        // The whole mechanism, end to end: the code travels in the link, the
        // joiner sends it back on entry, and the referrer is paid the referral
        // task's points. Without a referral task on the giveaway nothing is
        // paid at all — which is why the page has to say whether one exists.
        $giveaway = $this->giveaway();

        GiveawayTask::create([
            'giveaway_id' => $giveaway->id,
            'type' => 'referral',
            'title' => 'Invite a friend',
            'points' => 50,
        ]);

        $referrer = User::factory()->create();
        $entry = GiveawayEntry::create([
            'giveaway_id' => $giveaway->id,
            'user_id' => $referrer->id,
            'total_points' => 0,
        ]);

        $friend = User::factory()->create();

        $this->actingAs($friend)
            ->postJson("/api/v1/giveaways/{$giveaway->slug}/enter", [
                'referral_code' => $entry->referral_code,
            ])
            ->assertSuccessful();

        $entry->refresh();

        $this->assertSame(1, (int) $entry->referral_count);
        $this->assertSame(50, (int) $entry->total_points);
    }

    public function test_the_daily_bonus_is_claimed_once_a_day(): void
    {
        $user = User::factory()->create();
        $giveaway = $this->giveaway();

        $url = "/api/v1/giveaways/{$giveaway->slug}/daily-bonus";

        $this->actingAs($user)->postJson($url)->assertSuccessful();
        $first = (int) GiveawayEntry::where('user_id', $user->id)->value('streak_days');

        $this->actingAs($user)->postJson($url)->assertSuccessful();
        $this->actingAs($user)->postJson($url)->assertSuccessful();

        $this->assertSame($first, (int) GiveawayEntry::where('user_id', $user->id)->value('streak_days'));
    }

    public function test_a_winner_is_only_drawn_once(): void
    {
        $giveaway = $this->giveaway();
        $giveaway->update(['ends_at' => now()->subDay()]);

        foreach (range(1, 3) as $i) {
            $user = User::factory()->create();
            GiveawayEntry::create([
                'giveaway_id' => $giveaway->id,
                'user_id' => $user->id,
                'total_points' => 10,
            ]);
        }

        $winner = $giveaway->fresh()->pickWinner();
        $this->assertNotNull($winner);

        $giveaway->update(['winner_id' => $winner->id]);

        $this->expectException(\Exception::class);
        $giveaway->fresh()->pickWinner();
    }

    public function test_an_unfinished_draw_is_visible_to_staff(): void
    {
        // Drawing is manual and nothing reminded anyone, so a finished giveaway
        // could sit with its prize unawarded indefinitely.
        $giveaway = $this->withOneEntry($this->giveaway());
        $this->assertNull(GiveawayResource::getNavigationBadge());

        $giveaway->update(['ends_at' => now()->subDay()]);

        $this->assertSame('1', GiveawayResource::getNavigationBadge());
    }

    /**
     * The case the badge was built for and could not see.
     *
     * Its query said `status != 'ended'`, and an editor who closes a giveaway
     * without drawing it sets exactly that status. The World of Tanks draw sat
     * like this for 207 days with 18 people entered and the badge stayed empty
     * the whole time.
     */
    public function test_a_draw_closed_without_a_winner_is_still_visible(): void
    {
        $giveaway = $this->withOneEntry($this->giveaway());
        $giveaway->update(['ends_at' => now()->subDay(), 'status' => 'ended']);

        $this->assertSame('1', GiveawayResource::getNavigationBadge());
    }

    /**
     * A tiered draw writes its winners into the tiers and leaves `winner_id`
     * null, so reading that column would have made every finished multi-prize
     * giveaway badge for ever.
     */
    public function test_a_finished_draw_stops_being_reported(): void
    {
        $giveaway = $this->withOneEntry($this->giveaway());
        $giveaway->update([
            'ends_at' => now()->subDay(),
            'status' => 'ended',
            'winner_announced_at' => now(),
        ]);

        $this->assertNull(GiveawayResource::getNavigationBadge());
    }

    /**
     * Nobody entered, so there is nothing to draw — and a warning that cannot
     * be cleared is one people learn to ignore, which is how the first one was
     * missed.
     */
    public function test_a_giveaway_nobody_entered_is_not_reported(): void
    {
        $giveaway = $this->giveaway();
        $giveaway->update(['ends_at' => now()->subDay(), 'status' => 'ended']);

        $this->assertNull(GiveawayResource::getNavigationBadge());
    }
}
