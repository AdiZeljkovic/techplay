<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Platform unlocks, reachable.
 *
 * The endpoint used to answer with the hundred most recent unlocks and nothing
 * else — `where('achieved', true)` was baked in, and there was no paging and no
 * search. On a real account that is 100 rows out of 5,177, with the 4,240 still
 * locked unreachable by any request.
 */
class SteamAchievementsBrowsingTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2020-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function ach(User $user, int $gameId, string $name, bool $achieved, ?string $at = null): void
    {
        DB::table('steam_achievements')->insert([
            'user_id' => $user->id,
            'game_id' => $gameId,
            'steam_appid' => 1,
            'api_name' => 'api_'.uniqid(),
            'display_name' => $name,
            'description' => $name.' description',
            'achieved' => $achieved,
            'achieved_at' => $at,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** Named `shelf` because `seed` is Laravel's own and cannot be narrowed. */
    private function shelf(User $user): array
    {
        $a = $this->game('portal-2');
        $b = $this->game('hades');

        $this->ach($user, $a->id, 'Lab Rat', true, '2022-03-01 10:00:00');
        $this->ach($user, $a->id, 'Vertically Unchallenged', true, '2023-05-01 10:00:00');
        $this->ach($user, $a->id, 'Still Alive', false);
        $this->ach($user, $b->id, 'Escaped Once', true, '2021-01-01 10:00:00');
        $this->ach($user, $b->id, 'Escaped Twice', false);

        return [$a, $b];
    }

    public function test_locked_achievements_can_finally_be_looked_at(): void
    {
        $user = User::factory()->create(['username' => 'chroniclus']);
        $this->shelf($user);

        $response = $this->getJson('/api/v1/users/chroniclus/steam-achievements?status=locked')->assertOk();

        $names = array_column($response->json('data.items'), 'display_name');

        $this->assertCount(2, $names);
        $this->assertContains('Still Alive', $names);
        $this->assertContains('Escaped Twice', $names);
    }

    public function test_the_totals_describe_the_whole_shelf_not_the_page(): void
    {
        $user = User::factory()->create(['username' => 'chroniclus']);
        $this->shelf($user);

        $data = $this->getJson('/api/v1/users/chroniclus/steam-achievements?status=locked&per_page=12')
            ->assertOk()
            ->json('data');

        $this->assertSame(5, $data['total']);
        $this->assertSame(3, $data['achieved']);
        $this->assertSame(2, $data['locked']);
        $this->assertSame(60, $data['completion_pct']);
        // …while the page itself reports only what it carries.
        $this->assertSame(2, $data['meta']['total']);
    }

    public function test_everything_can_be_paged_through(): void
    {
        $user = User::factory()->create(['username' => 'chroniclus']);
        $this->shelf($user);

        $first = $this->getJson('/api/v1/users/chroniclus/steam-achievements?status=all&per_page=12')
            ->assertOk()
            ->json('data');

        $this->assertCount(5, $first['items']);
        $this->assertSame(1, $first['meta']['last_page']);

        // Unlocked lead, because that is what somebody came to look at.
        $this->assertTrue($first['items'][0]['achieved']);
        $this->assertFalse($first['items'][4]['achieved']);
    }

    public function test_the_list_can_be_searched(): void
    {
        $user = User::factory()->create(['username' => 'chroniclus']);
        $this->shelf($user);

        $items = $this->getJson('/api/v1/users/chroniclus/steam-achievements?status=all&q=escaped')
            ->assertOk()
            ->json('data.items');

        $this->assertCount(2, $items);
        foreach ($items as $item) {
            $this->assertStringContainsStringIgnoringCase('escaped', $item['display_name']);
        }
    }

    public function test_the_list_can_be_narrowed_to_one_game(): void
    {
        $user = User::factory()->create(['username' => 'chroniclus']);
        [$a] = $this->shelf($user);

        $data = $this->getJson("/api/v1/users/chroniclus/steam-achievements?status=all&game={$a->id}")
            ->assertOk()
            ->json('data');

        $this->assertCount(3, $data['items']);

        // And the games are offered with their own tallies, so the control can
        // be drawn without a request per game.
        $portal = collect($data['games'])->firstWhere('id', $a->id);
        $this->assertSame(3, $portal['total']);
        $this->assertSame(2, $portal['achieved']);
    }

    public function test_a_private_profile_still_refuses(): void
    {
        $user = User::factory()->create(['username' => 'hermit', 'profile_visibility' => 'friends']);
        $this->shelf($user);

        $this->getJson('/api/v1/users/hermit/steam-achievements')->assertStatus(403);
    }
}
