<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Game;
use App\Models\SteamAchievement;
use App\Models\TrophyCaseSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TrophyCaseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Achievement::query()->delete();
    }

    private function achievement(string $name): Achievement
    {
        return Achievement::create([
            'name' => $name,
            'description' => 'Earned it.',
            'points' => 50,
            'criteria_type' => 'posts_count',
            'criteria_value' => 1,
            'is_hidden' => false,
        ]);
    }

    public function test_the_owner_can_arrange_achievements_from_both_sources(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $ours = $this->achievement('Wordsmith');
        $user->achievements()->attach($ours->id, ['unlocked_at' => now()->subDay()]);

        $game = Game::create(['slug' => 'elden-ring', 'name' => 'Elden Ring', 'released' => '2022-02-25', 'genres' => ['RPG'], 'tags' => []]);
        $steam = SteamAchievement::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'steam_appid' => 1245620,
            'api_name' => 'ELDEN_LORD',
            'display_name' => 'Elden Lord',
            'description' => 'Finished it.',
            'icon_url' => 'https://example.test/icon.png',
            'achieved' => true,
            'achieved_at' => now(),
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/me/trophy-case', [
            'picks' => [
                ['source' => 'steam', 'reference' => $steam->id],
                ['source' => 'techplay', 'reference' => $ours->id],
            ],
        ]);

        $response->assertOk();
        $items = $response->json('data.items');

        $this->assertCount(2, $items);
        // Order is the arrangement, not the unlock date.
        $this->assertSame('steam', $items[0]['source']);
        $this->assertSame('Elden Lord', $items[0]['name']);
        $this->assertSame('Elden Ring', $items[0]['game']['name']);
        $this->assertSame('techplay', $items[1]['source']);
        $this->assertSame(50, $items[1]['points']);
    }

    public function test_it_refuses_achievements_the_reader_has_not_unlocked(): void
    {
        $user = User::factory()->create();
        $locked = $this->achievement('Never Earned');

        $response = $this->actingAs($user)->putJson('/api/v1/me/trophy-case', [
            'picks' => [['source' => 'techplay', 'reference' => $locked->id]],
        ]);

        $response->assertOk();
        $this->assertSame([], $response->json('data.items'));
        $this->assertDatabaseCount('trophy_case_slots', 0);
    }

    public function test_it_drops_duplicates_and_refuses_more_than_the_case_holds(): void
    {
        $user = User::factory()->create();

        $picks = [];
        foreach (range(1, 6) as $i) {
            $a = $this->achievement("Badge {$i}");
            $user->achievements()->attach($a->id, ['unlocked_at' => now()]);
            $picks[] = ['source' => 'techplay', 'reference' => $a->id];
        }

        // Six is more than the shelf holds, and the picker should never send
        // it — so the server says so rather than silently discarding one.
        $this->actingAs($user)->putJson('/api/v1/me/trophy-case', ['picks' => $picks])
            ->assertStatus(422);

        // The same achievement twice is a client slip, not a request to fill
        // two shelves with one thing.
        $five = array_slice($picks, 0, 5);
        $five[1] = $five[0];

        $this->actingAs($user)->putJson('/api/v1/me/trophy-case', ['picks' => $five])->assertOk();

        $slots = TrophyCaseSlot::where('user_id', $user->id);
        $this->assertSame(4, (clone $slots)->count());
        $this->assertSame(4, (clone $slots)->distinct('reference')->count('reference'));
        // Positions stay contiguous from zero even after a pick is dropped.
        $this->assertSame([0, 1, 2, 3], (clone $slots)->orderBy('position')->pluck('position')->all());
    }

    public function test_a_private_profile_does_not_hand_out_its_case(): void
    {
        $owner = User::factory()->create(['username' => 'hidden', 'profile_visibility' => 'friends']);
        $a = $this->achievement('Wordsmith');
        $owner->achievements()->attach($a->id, ['unlocked_at' => now()]);
        TrophyCaseSlot::create(['user_id' => $owner->id, 'source' => 'techplay', 'reference' => $a->id, 'position' => 0]);

        $this->getJson('/api/v1/users/hidden/trophy-case')->assertStatus(403);
        $this->actingAs($owner)->getJson('/api/v1/users/hidden/trophy-case')->assertOk();
    }

    public function test_a_slot_pointing_at_something_gone_is_skipped_not_drawn_empty(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $kept = $this->achievement('Kept');
        $retired = $this->achievement('Retired');
        $user->achievements()->attach([$kept->id, $retired->id], ['unlocked_at' => now()]);

        TrophyCaseSlot::create(['user_id' => $user->id, 'source' => 'techplay', 'reference' => $retired->id, 'position' => 0]);
        TrophyCaseSlot::create(['user_id' => $user->id, 'source' => 'techplay', 'reference' => $kept->id, 'position' => 1]);

        $retired->delete();

        $items = $this->getJson('/api/v1/users/adi/trophy-case')->assertOk()->json('data.items');

        $this->assertCount(1, $items);
        $this->assertSame('Kept', $items[0]['name']);
    }
}
