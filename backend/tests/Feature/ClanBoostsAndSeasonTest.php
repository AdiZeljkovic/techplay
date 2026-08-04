<?php

namespace Tests\Feature;

use App\Models\Clan;
use App\Models\ClanBoost;
use App\Models\ClanBuilding;
use App\Models\ClanMember;
use App\Models\ClanMission;
use App\Models\ClanMissionTemplate;
use App\Models\ClanTrophy;
use App\Models\Season;
use App\Models\User;
use App\Services\ClanMissionService;
use App\Services\ClanResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClanBoostsAndSeasonTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Clan $clan;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->owner = User::factory()->create();
        $this->clan = Clan::create([
            'owner_id' => $this->owner->id,
            'name' => 'Alpha Legion', 'slug' => 'alpha-legion',
            'is_public' => true, 'member_limit' => 50,
        ]);
        ClanMember::create([
            'clan_id' => $this->clan->id, 'user_id' => $this->owner->id,
            'role' => 'owner', 'joined_at' => now(),
        ]);
    }

    private function treasury(int $intel = 0, int $materials = 0, int $prestige = 0): void
    {
        $service = app(ClanResourceService::class);
        foreach (['intel' => $intel, 'materials' => $materials, 'prestige' => $prestige] as $resource => $amount) {
            if ($amount > 0) {
                $service->grant($this->clan, $resource, $amount, 'test_seed');
            }
        }
        $this->clan->refresh();
    }

    /* ── boosters ─────────────────────────────────────────────────────── */

    public function test_activating_a_booster_spends_the_treasury_and_is_officer_only(): void
    {
        $this->treasury(materials: 2000);

        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $this->clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);

        $this->actingAs($member)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'achievement_hunt'])
            ->assertStatus(403);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'achievement_hunt'])
            ->assertOk();

        $this->assertSame(2000 - 800, $this->clan->fresh()->materials);
        $this->assertSame(1, ClanBoost::count());
    }

    public function test_one_booster_slot_and_a_cooldown_between_runs(): void
    {
        $this->treasury(intel: 2000, materials: 5000);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'achievement_hunt'])
            ->assertOk();

        // Second booster while one runs → slot is busy.
        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'community_rally'])
            ->assertStatus(422);

        // After it ends, the SAME booster is still cooling down.
        ClanBoost::query()->update(['ends_at' => now()->subHour()]);
        Cache::flush();

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'achievement_hunt'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Achievement Hunt is still on cooldown.');

        // A different booster is free to start.
        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/boosts', ['key' => 'community_rally'])
            ->assertOk();
    }

    public function test_achievement_hunt_doubles_the_earn_but_never_raises_the_daily_ceiling(): void
    {
        ClanBoost::create([
            'clan_id' => $this->clan->id, 'key' => 'achievement_hunt',
            'starts_at' => now(), 'ends_at' => now()->addDay(),
        ]);

        $service = app(ClanResourceService::class);

        // 5 materials → doubled to 10.
        $service->award($this->owner, 'achievement_unlocked');
        $this->assertSame(10, $this->clan->fresh()->materials);

        // The daily cap (40) still trims: 10+10+10=30, next doubles to 10 → 40, then nothing.
        $service->award($this->owner, 'achievement_unlocked');
        $service->award($this->owner, 'achievement_unlocked');
        $service->award($this->owner, 'achievement_unlocked');
        $service->award($this->owner, 'achievement_unlocked');

        $this->assertSame(40, $this->clan->fresh()->materials, 'boosted earns still respect the ceiling');
    }

    public function test_double_contribution_pushes_missions_twice_within_the_same_cap(): void
    {
        ClanBuilding::create(['clan_id' => $this->clan->id, 'key' => 'mission_control', 'level' => 1]);
        ClanMissionTemplate::create([
            'name' => 'Bar Filler', 'type' => 'individual', 'criteria_type' => 'game_completed',
            'base_target' => 50, 'scales' => false, 'duration_days' => 7,
        ]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        ClanBoost::create([
            'clan_id' => $this->clan->id, 'key' => 'double_contribution',
            'starts_at' => now(), 'ends_at' => now()->addHour(),
        ]);

        $service = app(ClanMissionService::class);
        $service->record($this->clan->id, $this->owner, 'game_completed');
        $this->assertSame(2, ClanMission::first()->progress, 'one action counts twice');

        // Cap is 10 — seven boosted pushes land 10, not 14.
        for ($i = 0; $i < 6; $i++) {
            $service->record($this->clan->id, $this->owner, 'game_completed');
        }
        $this->assertSame(10, ClanMission::first()->progress);
    }

    public function test_recruitment_signal_features_the_clan_in_the_directory(): void
    {
        $other = Clan::create([
            'owner_id' => User::factory()->create()->id,
            'name' => 'Quiet Crew', 'slug' => 'quiet-crew', 'is_public' => true, 'member_limit' => 50,
        ]);

        // The other clan out-earns us this week…
        app(ClanResourceService::class)->grant($other, 'materials', 500, 'test_seed');

        ClanBoost::create([
            'clan_id' => $this->clan->id, 'key' => 'recruitment_signal',
            'starts_at' => now(), 'ends_at' => now()->addDay(),
        ]);

        $rows = $this->getJson('/api/v1/clans?sort=activity')->assertOk()->json('data.data');

        // …but the signal puts us first anyway, flagged as featured.
        $this->assertSame('alpha-legion', $rows[0]['slug']);
        $this->assertTrue($rows[0]['featured']);
        $this->assertFalse($rows[1]['featured']);
    }

    public function test_the_base_payload_carries_the_booster_panel(): void
    {
        $this->treasury(materials: 1000);

        $panel = $this->actingAs($this->owner)
            ->getJson('/api/v1/clans/alpha-legion/base')
            ->assertOk()
            ->json('data.boosts');

        $this->assertSame(1, $panel['slots']);
        $this->assertCount(5, $panel['boosters']);

        $hunt = collect($panel['boosters'])->firstWhere('key', 'achievement_hunt');
        $this->assertTrue($hunt['affordable']);
        $this->assertFalse($hunt['active']);
    }

    /* ── season settlement ────────────────────────────────────────────── */

    public function test_season_settlement_ranks_by_season_earnings_and_pays_the_podium(): void
    {
        $season = Season::create([
            'name' => 'Season 1: Foundation', 'slug' => 'season-1',
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->toDateString(),
            'is_active' => false,
        ]);

        $second = Clan::create(['owner_id' => User::factory()->create()->id, 'name' => 'Second', 'slug' => 'second', 'is_public' => true, 'member_limit' => 50]);

        // Alpha earned more THIS season; balances don't matter, the ledger does.
        $service = app(ClanResourceService::class);
        $service->grant($this->clan, 'materials', 900, 'test_seed');
        $service->grant($second, 'materials', 400, 'test_seed');

        $this->artisan('clans:settle-season', ['--season' => $season->id])->assertSuccessful();

        $champion = ClanTrophy::where('key', 'season_champion_1')->first();
        $this->assertSame($this->clan->id, $champion->clan_id);
        $this->assertSame($season->id, $champion->season_id);

        $runnerUp = ClanTrophy::where('key', 'season_champion_2')->first();
        $this->assertSame($second->id, $runnerUp->clan_id);

        // Champion prestige (1000) + best-small category (400).
        $this->assertSame(1400, $this->clan->fresh()->prestige);
    }

    public function test_settlement_is_idempotent(): void
    {
        $season = Season::create([
            'name' => 'Season 1', 'slug' => 's1',
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->toDateString(),
            'is_active' => false,
        ]);

        app(ClanResourceService::class)->grant($this->clan, 'materials', 100, 'test_seed');

        $this->artisan('clans:settle-season', ['--season' => $season->id])->assertSuccessful();
        $trophies = ClanTrophy::count();
        $prestige = $this->clan->fresh()->prestige;

        $this->artisan('clans:settle-season', ['--season' => $season->id])->assertSuccessful();

        $this->assertSame($trophies, ClanTrophy::count());
        $this->assertSame($prestige, $this->clan->fresh()->prestige, 'a re-run must not pay twice');
    }

    public function test_trophies_appear_on_the_clan_profile(): void
    {
        ClanTrophy::create([
            'clan_id' => $this->clan->id, 'key' => 'season_champion_1',
            'title' => 'Season 1 — Champions', 'awarded_at' => now(),
        ]);

        $trophies = $this->getJson('/api/v1/clans/alpha-legion')->assertOk()->json('data.trophies');

        $this->assertCount(1, $trophies);
        $this->assertSame('Season 1 — Champions', $trophies[0]['title']);
    }
}
