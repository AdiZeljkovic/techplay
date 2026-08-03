<?php

namespace Tests\Feature;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanBuilding;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\ClanMission;
use App\Models\ClanMissionTemplate;
use App\Models\User;
use App\Services\ClanMissionService;
use App\Services\ClanResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClanMissionsTest extends TestCase
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
        ClanBuilding::create(['clan_id' => $this->clan->id, 'key' => 'mission_control', 'level' => 1]);
    }

    private function template(array $attrs = []): ClanMissionTemplate
    {
        static $n = 0;
        $n++;

        return ClanMissionTemplate::create(array_merge([
            'name' => 'Mission '.$n,
            'type' => 'individual',
            'criteria_type' => 'game_completed',
            'base_target' => 5,
            'scales' => false,
            'duration_days' => 7,
            'reward_materials' => 300,
            'reward_prestige' => 50,
        ], $attrs));
    }

    private function member(): User
    {
        $user = User::factory()->create();
        ClanMember::create(['clan_id' => $this->clan->id, 'user_id' => $user->id, 'role' => 'member', 'joined_at' => now()]);

        return $user;
    }

    /* ── spawning ─────────────────────────────────────────────────────── */

    public function test_missions_spawn_only_for_clans_with_a_mission_control(): void
    {
        $this->template();

        $bare = Clan::create(['owner_id' => User::factory()->create()->id, 'name' => 'No MC', 'slug' => 'no-mc', 'is_public' => true, 'member_limit' => 50]);

        app(ClanMissionService::class)->spawnWeekly();

        $this->assertSame(1, ClanMission::where('clan_id', $this->clan->id)->count());
        $this->assertSame(0, ClanMission::where('clan_id', $bare->id)->count());
    }

    public function test_spawning_is_idempotent_and_fills_only_free_slots(): void
    {
        $this->template();
        $this->template();

        $service = app(ClanMissionService::class);
        $service->spawnForClan($this->clan);
        $service->spawnForClan($this->clan);

        // MC1 = one weekly slot, however many templates exist.
        $this->assertSame(1, ClanMission::where('clan_id', $this->clan->id)->where('status', 'active')->count());
    }

    public function test_operations_need_mission_control_three(): void
    {
        $this->template(['type' => 'operation', 'min_mission_control' => 3, 'stages' => [['target' => 5, 'materials' => 100]]]);

        app(ClanMissionService::class)->spawnForClan($this->clan);
        $this->assertSame(0, ClanMission::count());

        ClanBuilding::where('clan_id', $this->clan->id)->update(['level' => 3]);
        Cache::flush();

        app(ClanMissionService::class)->spawnForClan($this->clan);
        $this->assertSame(1, ClanMission::count());
    }

    public function test_targets_scale_with_active_members_with_diminishing_returns(): void
    {
        $template = $this->template(['scales' => true, 'base_target' => 30]);
        $service = app(ClanMissionService::class);

        // One active member — the baseline of 10 floors the multiplier at 1.
        app(ClanResourceService::class)->award($this->owner, 'game_completed');
        $this->assertSame(30, $service->scaledTarget($this->clan->fresh(), $template));

        // Fifty actives: 30 × (50/10)^0.8 ≈ 109 — not 150.
        for ($i = 0; $i < 49; $i++) {
            $user = $this->member();
            ClanLedger::create([
                'clan_id' => $this->clan->id, 'user_id' => $user->id,
                'resource' => 'materials', 'amount' => 5, 'reason' => 'test', 'balance_after' => 0,
            ]);
        }

        $scaled = $service->scaledTarget($this->clan->fresh(), $template);
        $this->assertGreaterThan(100, $scaled);
        $this->assertLessThan(115, $scaled);
    }

    /* ── progress ─────────────────────────────────────────────────────── */

    public function test_the_earning_action_also_pushes_the_mission_bar(): void
    {
        $this->template(['criteria_type' => 'game_completed', 'base_target' => 5]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        app(ClanResourceService::class)->award($this->owner, 'game_completed');

        $mission = ClanMission::first();
        $this->assertSame(1, $mission->progress);
        $this->assertSame(1, $mission->contributions()->count());
    }

    public function test_one_member_cannot_finish_a_collective_goal_alone_in_a_day(): void
    {
        $this->template(['criteria_type' => 'game_completed', 'base_target' => 50]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        // The daily member cap is 10 — pushes beyond it are dropped.
        $service = app(ClanMissionService::class);
        for ($i = 0; $i < 15; $i++) {
            $service->record($this->clan->id, $this->owner, 'game_completed');
        }

        $this->assertSame(10, ClanMission::first()->progress);
    }

    public function test_completion_pays_the_treasury_and_writes_the_feed(): void
    {
        $this->template(['criteria_type' => 'review_published', 'base_target' => 2, 'reward_intel' => 250, 'reward_prestige' => 60]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        $service = app(ClanMissionService::class);
        $service->record($this->clan->id, $this->owner, 'review_published');
        $service->record($this->clan->id, $this->owner, 'review_published');

        $mission = ClanMission::first();
        $this->assertSame('completed', $mission->status);

        $this->clan->refresh();
        $this->assertSame(250, $this->clan->intel);
        $this->assertSame(60, $this->clan->prestige);
        $this->assertTrue(ClanActivity::where('type', 'mission_completed')->exists());
    }

    public function test_squad_missions_finish_on_people_not_on_the_bar(): void
    {
        $this->template([
            'type' => 'squad', 'criteria_type' => 'session_logged',
            'base_target' => 2, 'per_member_target' => 2, 'scales' => false,
        ]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        $service = app(ClanMissionService::class);

        // One member doing four sessions is not a squad.
        for ($i = 0; $i < 4; $i++) {
            $service->record($this->clan->id, $this->owner, 'session_logged');
        }
        $this->assertSame('active', ClanMission::first()->status);

        // A second member pulling their weight closes it.
        $second = $this->member();
        $service->record($this->clan->id, $second, 'session_logged');
        $service->record($this->clan->id, $second, 'session_logged');

        $this->assertSame('completed', ClanMission::first()->status);
    }

    public function test_operations_pay_stage_by_stage_as_thresholds_fall(): void
    {
        ClanBuilding::where('clan_id', $this->clan->id)->update(['level' => 3]);
        Cache::flush();

        $this->template([
            'type' => 'operation', 'criteria_type' => 'game_completed',
            'base_target' => 6, 'scales' => false, 'min_mission_control' => 3,
            'reward_materials' => 500,
            'stages' => [
                ['target' => 2, 'materials' => 100, 'prestige' => 10],
                ['target' => 4, 'materials' => 150, 'prestige' => 20],
            ],
        ]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        $service = app(ClanMissionService::class);
        $second = $this->member();

        $service->record($this->clan->id, $this->owner, 'game_completed');
        $service->record($this->clan->id, $this->owner, 'game_completed');

        $this->assertSame(1, ClanMission::first()->stage);
        $this->assertSame(100, $this->clan->fresh()->materials);

        $service->record($this->clan->id, $second, 'game_completed');
        $service->record($this->clan->id, $second, 'game_completed');

        // Stage two crossed AND that was the last stage → operation complete,
        // final reward on top of stage rewards.
        $mission = ClanMission::first();
        $this->assertSame(2, $mission->stage);
        $this->assertSame('completed', $mission->status);
        $this->assertSame(100 + 150 + 500, $this->clan->fresh()->materials);
    }

    public function test_expired_missions_settle_on_read_and_stop_taking_progress(): void
    {
        $this->template(['criteria_type' => 'game_completed', 'base_target' => 50]);
        app(ClanMissionService::class)->spawnForClan($this->clan);

        ClanMission::query()->update(['ends_at' => now()->subHour()]);

        $service = app(ClanMissionService::class);
        $service->record($this->clan->id, $this->owner, 'game_completed');
        $this->assertSame(0, ClanMission::first()->progress, 'an expired mission takes no progress');

        $service->activeFor($this->clan);
        $this->assertSame('expired', ClanMission::first()->status);
    }

    public function test_the_base_payload_carries_the_mission_board(): void
    {
        $this->template(['criteria_type' => 'game_completed', 'base_target' => 5, 'name' => 'The Backlog Offensive']);
        app(ClanMissionService::class)->spawnForClan($this->clan);
        app(ClanResourceService::class)->award($this->owner, 'game_completed');

        $missions = $this->actingAs($this->owner)
            ->getJson('/api/v1/clans/alpha-legion/base')
            ->assertOk()
            ->json('data.missions');

        $this->assertCount(1, $missions);
        $this->assertSame('The Backlog Offensive', $missions[0]['name']);
        $this->assertSame(1, $missions[0]['progress']);
        $this->assertSame(20, $missions[0]['percent']);
        $this->assertSame($this->owner->username, $missions[0]['top_contributors'][0]['username']);
    }
}
