<?php

namespace Tests\Feature;

use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class QuestBoardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        // Migrations seed the real catalogue; these tests assert on counts.
        Quest::query()->delete();
    }

    private function quest(string $name, string $type, string $criteria = 'forum_post'): Quest
    {
        return Quest::create([
            'name' => $name,
            'description' => 'Do the thing.',
            'type' => $type,
            'criteria_type' => $criteria,
            'criteria_value' => 1,
            'xp_reward' => 10,
            'bounty_reward' => 5,
            'is_active' => true,
        ]);
    }

    private function board(User $user): array
    {
        return $this->actingAs($user)->getJson('/api/v1/user/quests')->assertOk()->json('data');
    }

    public function test_the_board_shows_three_dailies_however_many_exist(): void
    {
        $user = User::factory()->create();
        foreach (range(1, 8) as $i) {
            $this->quest("Daily {$i}", 'daily');
        }

        $board = $this->board($user);

        $this->assertCount(3, $board);
    }

    public function test_two_readers_do_not_get_the_same_three(): void
    {
        foreach (range(1, 12) as $i) {
            $this->quest("Daily {$i}", 'daily');
        }

        $a = collect($this->board(User::factory()->create()))->pluck('id')->sort()->values();
        $b = collect($this->board(User::factory()->create()))->pluck('id')->sort()->values();

        // Not a guarantee for any given pair, but across twelve quests two
        // identical draws would mean the seed is not doing anything.
        $this->assertNotEquals($a->all(), $b->all());
    }

    public function test_the_same_reader_gets_the_same_three_twice_in_a_day(): void
    {
        $user = User::factory()->create();
        foreach (range(1, 10) as $i) {
            $this->quest("Daily {$i}", 'daily');
        }

        $first = collect($this->board($user))->pluck('id')->all();
        $second = collect($this->board($user))->pluck('id')->all();

        $this->assertSame($first, $second);
    }

    public function test_a_finished_onboarding_quest_leaves_the_board(): void
    {
        $user = User::factory()->create();
        $done = $this->quest('Welcome Aboard', 'permanent');
        $this->quest('Stock the Shelf', 'permanent');

        QuestProgress::create([
            'user_id' => $user->id,
            'quest_id' => $done->id,
            'progress' => 1,
            'completed_at' => now()->subDay(),
        ]);

        $names = collect($this->board($user))->pluck('name');

        $this->assertNotContains('Welcome Aboard', $names);
        $this->assertContains('Stock the Shelf', $names);
    }

    public function test_a_daily_finished_today_stays_visible(): void
    {
        $user = User::factory()->create();
        $today = $this->quest('Check In', 'daily');

        QuestProgress::create([
            'user_id' => $user->id,
            'quest_id' => $today->id,
            'progress' => 1,
            'completed_at' => now(),
        ]);

        $board = collect($this->board($user));

        // The board shows the day's work, not just the part still outstanding.
        $this->assertSame(['Check In'], $board->pluck('name')->all());
        $this->assertTrue($board->first()['completed']);
    }
}
