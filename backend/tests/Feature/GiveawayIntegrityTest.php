<?php

namespace Tests\Feature;

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
        $giveaway = $this->giveaway();
        $this->assertNull(\App\Filament\Resources\GiveawayResource::getNavigationBadge());

        $giveaway->update(['ends_at' => now()->subDay()]);

        $this->assertSame('1', \App\Filament\Resources\GiveawayResource::getNavigationBadge());
    }
}
