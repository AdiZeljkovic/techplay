<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Services\BountyService;
use App\Services\RewardLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RewardFeedbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_a_write_that_pays_out_says_so_in_its_own_response(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        Game::create(['slug' => 'hades', 'name' => 'Hades', 'released' => '2020-09-17', 'genres' => ['Action'], 'tags' => []]);

        $response = $this->actingAs($user)
            ->putJson('/api/v1/collection/games/hades', ['status' => 'playing'])
            ->assertSuccessful();

        // Adding a game pays XP, and it used to do so entirely silently.
        $this->assertIsArray($response->json('rewards'));
        $this->assertGreaterThan(0, $response->json('rewards.xp'));
    }

    public function test_a_read_never_announces_anything(): void
    {
        $user = User::factory()->create();

        // A GET that happens to trip an award would otherwise fire confetti in
        // the middle of an unrelated page load.
        app(RewardLedger::class)->xp(50, 'test');

        $this->actingAs($user)
            ->getJson('/api/v1/user/quests')
            ->assertOk()
            ->assertJsonMissingPath('rewards');
    }

    public function test_a_write_that_pays_nothing_stays_quiet(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/v1/me/trophy-case', ['picks' => []])
            ->assertOk()
            ->assertJsonMissingPath('rewards');
    }

    public function test_the_ledger_totals_rather_than_transcribes(): void
    {
        $ledger = app(RewardLedger::class);
        $ledger->xp(10, 'game_added');
        $ledger->xp(5, 'quest');
        $ledger->bounty(15, 'quest');

        // Three separate awards from one action is an implementation detail.
        $this->assertSame(['xp' => 15, 'bounty' => 15], $ledger->toArray());
    }

    public function test_spending_is_not_announced(): void
    {
        $user = User::factory()->create(['bounty_balance' => 1000]);
        $ledger = app(RewardLedger::class);

        app(BountyService::class)->award($user, 500, 'Bought a frame', 'spend');

        // "-500 bounty" flying out of a purchase button is a scolding.
        $this->assertTrue($ledger->isEmpty());
    }
}
