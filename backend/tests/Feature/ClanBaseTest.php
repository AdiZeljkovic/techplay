<?php

namespace Tests\Feature;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanBuilding;
use App\Models\ClanMember;
use App\Models\ClanProject;
use App\Models\User;
use App\Services\ClanResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClanBaseTest extends TestCase
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
            'name' => 'Alpha Legion',
            'slug' => 'alpha-legion',
            'is_public' => true,
            'member_limit' => 50,
        ]);
        ClanMember::create([
            'clan_id' => $this->clan->id, 'user_id' => $this->owner->id,
            'role' => 'owner', 'joined_at' => now(),
        ]);
    }

    private function treasury(int $intel, int $materials, int $prestige = 0): void
    {
        $service = app(ClanResourceService::class);
        if ($intel > 0) {
            $service->grant($this->clan, 'intel', $intel, 'test_seed');
        }
        if ($materials > 0) {
            $service->grant($this->clan, 'materials', $materials, 'test_seed');
        }
        if ($prestige > 0) {
            $service->grant($this->clan, 'prestige', $prestige, 'test_seed');
        }
        $this->clan->refresh();
    }

    private function building(string $key, int $level): void
    {
        ClanBuilding::updateOrCreate(['clan_id' => $this->clan->id, 'key' => $key], ['level' => $level]);
        Cache::forget("clan.buildings.{$this->clan->id}");
    }

    /* ── the overview ─────────────────────────────────────────────────── */

    public function test_the_base_is_for_members_only(): void
    {
        $stranger = User::factory()->create();

        $this->actingAs($stranger)->getJson('/api/v1/clans/alpha-legion/base')->assertStatus(403);
        $this->actingAs($this->owner)->getJson('/api/v1/clans/alpha-legion/base')->assertOk();
    }

    public function test_the_overview_gates_buildings_behind_the_command_center(): void
    {
        $data = $this->actingAs($this->owner)->getJson('/api/v1/clans/alpha-legion/base')->assertOk()->json('data');

        $buildings = collect($data['base']['buildings'])->keyBy('key');

        $this->assertFalse($buildings['command_center']['locked']);
        $this->assertTrue($buildings['archive']['locked'], 'Archive needs CC3');
        $this->assertTrue($buildings['workshop']['locked'], 'Workshop needs CC4');
        $this->assertSame(1, $data['base']['project_slots']);
        $this->assertSame(['Not built yet'], $buildings['vault']['effects']);
    }

    /* ── the lifecycle ────────────────────────────────────────────────── */

    public function test_a_project_funds_from_the_treasury_and_starts_its_timer_when_full(): void
    {
        $this->treasury(1000, 1000);

        $projectId = $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertOk()
            ->json('data.id');

        // CC L1 costs 150 intel / 250 materials.
        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['intel' => 150, 'materials' => 100])
            ->assertOk()
            ->assertJsonPath('data.status', 'funding');

        $result = $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['materials' => 150])
            ->assertOk()
            ->json('data');

        $this->assertSame('building', $result['status']);
        $this->assertNotNull($result['finishes_at']);

        // The treasury paid exactly the cost, into negative ledger rows.
        $this->clan->refresh();
        $this->assertSame(850, $this->clan->intel);
        $this->assertSame(750, $this->clan->materials);
    }

    public function test_funding_more_than_the_treasury_holds_is_refused(): void
    {
        $this->treasury(50, 50);

        $projectId = $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertOk()->json('data.id');

        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['intel' => 150])
            ->assertStatus(422);
    }

    public function test_a_finished_timer_becomes_a_finished_building_on_the_next_read(): void
    {
        $this->treasury(1000, 1000);

        $projectId = $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertOk()->json('data.id');

        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['intel' => 150, 'materials' => 250])
            ->assertOk();

        // Time passes.
        ClanProject::whereKey($projectId)->update(['finishes_at' => now()->subMinute()]);

        $data = $this->actingAs($this->owner)->getJson('/api/v1/clans/alpha-legion/base')->assertOk()->json('data');

        $buildings = collect($data['base']['buildings'])->keyBy('key');
        $this->assertSame(1, $buildings['command_center']['level']);
        $this->assertTrue(
            ClanActivity::where('clan_id', $this->clan->id)->where('type', 'construction_done')->exists()
        );
        // CC1 raises the roster ceiling.
        $this->assertSame(60, $data['clan']['member_limit']);
    }

    public function test_members_cannot_run_construction_and_officers_cannot_build_gated_buildings(): void
    {
        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $this->clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);

        $this->actingAs($member)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertStatus(403);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'archive'])
            ->assertStatus(422);
    }

    public function test_one_project_slot_until_the_command_center_grows(): void
    {
        $this->building('command_center', 1);
        $this->treasury(5000, 5000);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'vault'])
            ->assertOk();

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'training_grounds'])
            ->assertStatus(422);
    }

    public function test_speed_up_spends_prestige_and_completes_now(): void
    {
        $this->building('command_center', 1);
        $this->treasury(1000, 1000, 5000);

        $projectId = $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'vault'])
            ->assertOk()->json('data.id');

        // Vault L1: 100 intel / 200 materials.
        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['intel' => 100, 'materials' => 200])
            ->assertOk();

        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/speed-up")
            ->assertOk();

        $this->assertSame('done', ClanProject::find($projectId)->status);
        $this->assertSame(1, ClanBuilding::where('clan_id', $this->clan->id)->where('key', 'vault')->value('level'));
        $this->assertLessThan(5000, $this->clan->fresh()->prestige, 'prestige was spent');
    }

    public function test_cancelling_returns_every_funded_resource(): void
    {
        $this->treasury(1000, 1000);

        $projectId = $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertOk()->json('data.id');

        $this->actingAs($this->owner)
            ->postJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}/fund", ['intel' => 150, 'materials' => 100])
            ->assertOk();

        $this->assertSame(850, $this->clan->fresh()->intel);

        $this->actingAs($this->owner)
            ->deleteJson("/api/v1/clans/alpha-legion/base/projects/{$projectId}")
            ->assertOk();

        $this->clan->refresh();
        $this->assertSame(1000, $this->clan->intel);
        $this->assertSame(1000, $this->clan->materials);
        $this->assertSame('cancelled', ClanProject::find($projectId)->status);
    }

    /* ── the real effects ─────────────────────────────────────────────── */

    public function test_the_vault_caps_what_the_treasury_can_hold(): void
    {
        // Base capacity 10k; a grant beyond it is trimmed to the ceiling.
        app(ClanResourceService::class)->grant($this->clan, 'materials', 25000, 'test_flood');

        $this->assertSame(10000, $this->clan->fresh()->materials);

        // A vault raises the ceiling.
        $this->building('vault', 2);
        app(ClanResourceService::class)->grant($this->clan, 'materials', 25000, 'test_flood');

        $this->assertSame(30000, $this->clan->fresh()->materials);
    }

    public function test_training_grounds_boost_clan_xp_from_achievements_only(): void
    {
        $this->building('training_grounds', 5); // +10% XP on achievement earns

        $service = app(ClanResourceService::class);
        $service->award($this->owner, 'achievement_unlocked'); // 5 materials → 5 XP +10% = 6
        $xpAfterAchievement = $this->clan->fresh()->xp;
        $this->assertSame(6, $xpAfterAchievement);

        $service->award($this->owner, 'game_completed'); // 15 materials → flat 15 XP
        $this->assertSame($xpAfterAchievement + 15, $this->clan->fresh()->xp);
    }

    public function test_the_command_center_cap_follows_the_clan_tier(): void
    {
        // Outpost tier (1) caps the CC at level 2.
        $this->building('command_center', 2);
        $this->treasury(50000, 50000);
        // Seeding the treasury levelled the clan — pin it back to Outpost,
        // because the cap under test is the tier's, not the treasury's.
        $this->clan->forceFill(['xp' => 0, 'level' => 1])->save();

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/projects', ['building' => 'command_center'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'The Command Center is capped by your clan tier — level the clan first.');
    }
}
