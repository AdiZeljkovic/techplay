<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AchievementsPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        // A migration seeds the real catalog; these tests assert on exact
        // counts, so they build their own.
        Achievement::query()->delete();
    }

    private function achievement(array $attrs = []): Achievement
    {
        return Achievement::create(array_merge([
            'name' => 'Wordsmith',
            'description' => 'Post 10 times.',
            'points' => 25,
            'criteria_type' => 'posts_count',
            'criteria_value' => 10,
            'is_hidden' => false,
        ], $attrs));
    }

    public function test_it_returns_the_catalog_with_progress_towards_locked_achievements(): void
    {
        $user = User::factory()->create(['username' => 'adi', 'xp' => 400]);
        $this->achievement(['name' => 'Grinder', 'criteria_type' => 'xp', 'criteria_value' => 1000]);

        $item = $this->getJson('/api/v1/users/adi/achievements')
            ->assertOk()
            ->json('data.items.0');

        $this->assertFalse($item['is_unlocked']);
        $this->assertSame(400, $item['current']);
        $this->assertSame(1000, $item['criteria_value']);
        $this->assertSame(40, $item['percent']);
        $this->assertSame('Progression', $item['category']);
    }

    public function test_an_unlocked_achievement_reads_as_complete_and_counts_towards_the_score(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $a = $this->achievement(['points' => 40]);
        $user->achievements()->attach($a->id, ['unlocked_at' => now()]);

        $data = $this->getJson('/api/v1/users/adi/achievements')->assertOk()->json('data');

        $this->assertSame(40, $data['score']);
        $this->assertSame(1, $data['unlocked_count']);
        $this->assertTrue($data['items'][0]['is_unlocked']);
        $this->assertSame(100, $data['items'][0]['percent']);
        $this->assertNotNull($data['items'][0]['unlocked_at']);
    }

    public function test_manual_grant_achievements_report_no_progress_bar(): void
    {
        User::factory()->create(['username' => 'adi']);
        $this->achievement(['name' => 'Founder', 'criteria_type' => 'special', 'criteria_value' => 1]);

        $item = $this->getJson('/api/v1/users/adi/achievements')->assertOk()->json('data.items.0');

        $this->assertNull($item['current']);
        $this->assertNull($item['percent']);
    }

    public function test_hidden_achievements_stay_out_of_the_catalog_until_unlocked(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $secret = $this->achievement(['name' => 'Secret', 'is_hidden' => true]);

        $this->getJson('/api/v1/users/adi/achievements')->assertOk()->assertJsonCount(0, 'data.items');

        $user->achievements()->attach($secret->id, ['unlocked_at' => now()]);
        Cache::flush();

        $this->getJson('/api/v1/users/adi/achievements')->assertOk()->assertJsonCount(1, 'data.items');
    }

    public function test_rarity_is_withheld_while_the_population_is_too_small_to_mean_anything(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $a = $this->achievement();
        $user->achievements()->attach($a->id, ['unlocked_at' => now()]);

        $data = $this->getJson('/api/v1/users/adi/achievements')->assertOk()->json('data');

        $this->assertFalse($data['rarity_available']);
        $this->assertNull($data['items'][0]['rarity_percent']);
        $this->assertNull($data['items'][0]['rarity']);
    }

    public function test_rarity_is_published_once_enough_people_have_unlocked_anything(): void
    {
        $common = $this->achievement(['name' => 'Common']);
        $epic = $this->achievement(['name' => 'Epic', 'criteria_value' => 500]);

        // 60 achievers clears the threshold; only 3 of them hold the epic.
        $users = User::factory()->count(60)->create();
        foreach ($users as $i => $u) {
            $u->achievements()->attach($common->id, ['unlocked_at' => now()]);
            if ($i < 3) {
                $u->achievements()->attach($epic->id, ['unlocked_at' => now()]);
            }
        }

        $viewer = User::factory()->create(['username' => 'adi']);
        $items = collect($this->getJson('/api/v1/users/adi/achievements')->assertOk()->json('data.items'))
            ->keyBy('name');

        $this->assertSame(100, $items['Common']['rarity_percent']);
        $this->assertSame('common', $items['Common']['rarity']);
        $this->assertSame(5, $items['Epic']['rarity_percent']);
        $this->assertSame('epic', $items['Epic']['rarity']);
        $this->assertNotNull($viewer);
    }

    public function test_a_private_profile_hides_its_achievements_from_strangers(): void
    {
        User::factory()->create([
            'username' => 'adi',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);
        $this->achievement();

        $this->getJson('/api/v1/users/adi/achievements')->assertStatus(403);
    }

    public function test_the_owner_always_sees_their_own_achievements(): void
    {
        $user = User::factory()->create([
            'username' => 'adi',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);
        $this->achievement();

        $this->actingAs($user)
            ->getJson('/api/v1/users/adi/achievements')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');
    }
}
