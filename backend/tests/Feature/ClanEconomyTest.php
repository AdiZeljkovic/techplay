<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanInvite;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\Game;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\ClanLevelService;
use App\Services\ClanResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClanEconomyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function clan(User $owner, array $attrs = []): Clan
    {
        static $n = 0;
        $n++;

        $clan = Clan::create(array_merge([
            'owner_id' => $owner->id,
            'name' => 'Alpha Legion '.$n,
            'slug' => 'alpha-legion-'.$n,
            'tag' => 'ALPHA',
            'is_public' => true,
            'member_limit' => 50,
        ], $attrs));

        ClanMember::create([
            'clan_id' => $clan->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        return $clan;
    }

    private function game(): Game
    {
        static $n = 0;
        $n++;

        return Game::create(['slug' => 'clan-game-'.$n, 'name' => 'Clan Game '.$n]);
    }

    /* ── the service ──────────────────────────────────────────────────── */

    public function test_an_award_moves_balances_lifetime_xp_and_the_ledger_together(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);

        app(ClanResourceService::class)->award($user, 'game_completed'); // 15 materials

        $clan->refresh();
        $this->assertSame(15, $clan->materials);
        $this->assertSame(15, $clan->materials_lifetime);
        $this->assertSame(15, $clan->xp);

        $row = ClanLedger::first();
        $this->assertSame($user->id, $row->user_id);
        $this->assertSame('materials', $row->resource);
        $this->assertSame(15, $row->amount);
        $this->assertSame('game_completed', $row->reason);
        $this->assertSame(15, $row->balance_after);
    }

    public function test_a_user_without_a_clan_earns_their_clan_nothing_and_nothing_breaks(): void
    {
        $user = User::factory()->create();

        app(ClanResourceService::class)->award($user, 'game_completed');

        $this->assertSame(0, ClanLedger::count());
    }

    public function test_the_daily_cap_trims_and_then_blocks(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);
        $service = app(ClanResourceService::class);

        // Cap is 40 materials/day; each completion pays 15.
        $service->award($user, 'game_completed'); // 15
        $service->award($user, 'game_completed'); // 30
        $service->award($user, 'game_completed'); // trimmed to 10 → 40
        $service->award($user, 'game_completed'); // dropped

        $this->assertSame(40, $clan->refresh()->materials);
        $this->assertSame(3, ClanLedger::count());
        $this->assertSame(10, ClanLedger::latest('id')->first()->amount);
    }

    public function test_the_cap_is_per_member_not_per_clan(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        $second = User::factory()->create();
        ClanMember::create(['clan_id' => $clan->id, 'user_id' => $second->id, 'role' => 'member', 'joined_at' => now()]);

        $service = app(ClanResourceService::class);
        foreach ([$owner, $second] as $member) {
            $service->award($member, 'game_completed');
            $service->award($member, 'game_completed');
            $service->award($member, 'game_completed'); // each member reaches their own 40
        }

        $this->assertSame(80, $clan->refresh()->materials);
    }

    public function test_grant_bypasses_the_member_cap_for_mission_style_rewards(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);

        app(ClanResourceService::class)->grant($clan, 'prestige', 250, 'operation_reward');

        $this->assertSame(250, $clan->refresh()->prestige);
        $this->assertSame(250 * 5, $clan->xp, 'prestige pulls 5× on clan XP');
    }

    public function test_the_level_ladder_climbs_and_writes_the_feed(): void
    {
        $levels = app(ClanLevelService::class);
        $this->assertSame(0, $levels->xpForLevel(1));
        $this->assertSame(500, $levels->xpForLevel(2));
        $this->assertSame('Outpost', $levels->tierForLevel(4)['name']);
        $this->assertSame('Garrison', $levels->tierForLevel(5)['name']);
        $this->assertSame('Bastion', $levels->tierForLevel(10)['name']);
        $this->assertSame('Citadel', $levels->tierForLevel(15)['name']);
        $this->assertSame('Nexus', $levels->tierForLevel(20)['name']);

        $user = User::factory()->create();
        $clan = $this->clan($user);

        app(ClanResourceService::class)->grant($clan, 'materials', 600, 'test_grant');

        $this->assertSame(2, $clan->refresh()->level);

        $feed = ClanActivity::where('type', 'level_up')->first();
        $this->assertNotNull($feed);
        $this->assertStringContainsString('Level 2', $feed->title);
    }

    /* ── the hooks ────────────────────────────────────────────────────── */

    public function test_completing_a_game_pays_the_clan_materials(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);
        $game = $this->game();

        $this->actingAs($user)->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed'])->assertStatus(201);

        // The completion may also unlock seeded achievements — both earns land.
        $this->assertTrue(
            ClanLedger::where('clan_id', $clan->id)->where('reason', 'game_completed')->exists()
        );
    }

    public function test_unlocking_an_achievement_pays_the_clan_materials(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);
        Achievement::create([
            'name' => 'Clan Fuel', 'description' => 'x', 'points' => 10,
            'criteria_type' => 'special', 'criteria_value' => 1, 'is_hidden' => false,
        ]);

        app(AchievementService::class)->unlockByName($user, 'Clan Fuel');

        $this->assertTrue(
            ClanLedger::where('clan_id', $clan->id)->where('reason', 'achievement_unlocked')->exists()
        );
    }

    public function test_a_real_journal_session_feeds_the_clan_but_a_short_note_does_not(): void
    {
        $user = User::factory()->create();
        $clan = $this->clan($user);

        $this->actingAs($user)->postJson('/api/v1/journal/sessions', [
            'game_slug' => $this->game()->slug, 'played_on' => now()->toDateString(), 'minutes' => 90,
        ])->assertOk();

        $this->actingAs($user)->postJson('/api/v1/journal/sessions', [
            'game_slug' => $this->game()->slug, 'played_on' => now()->toDateString(), 'minutes' => 10,
        ])->assertOk();

        $this->assertSame(1, ClanLedger::where('clan_id', $clan->id)->where('reason', 'session_logged')->count());
    }

    /* ── applications ─────────────────────────────────────────────────── */

    public function test_the_application_flow_from_apply_to_member(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        $applicant = User::factory()->create();

        $this->actingAs($applicant)
            ->postJson("/api/v1/clans/{$clan->slug}/apply", ['message' => 'Let me in'])
            ->assertOk();

        $applications = $this->actingAs($owner)
            ->getJson("/api/v1/clans/{$clan->slug}/applications")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $applications);

        $this->actingAs($owner)
            ->postJson("/api/v1/clans/applications/{$applications[0]['id']}/respond", ['accept' => true])
            ->assertOk();

        $this->assertTrue($clan->hasMember($applicant->id));
        $this->assertTrue(ClanActivity::where('type', 'member_joined')->where('user_id', $applicant->id)->exists());
    }

    public function test_a_closed_clan_takes_no_applications_and_members_of_other_clans_cannot_apply(): void
    {
        $owner = User::factory()->create();
        $closed = $this->clan($owner, ['status' => 'closed']);

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->postJson("/api/v1/clans/{$closed->slug}/apply")->assertStatus(403);

        $otherOwner = User::factory()->create();
        $open = $this->clan($otherOwner);
        $this->actingAs($owner)->postJson("/api/v1/clans/{$open->slug}/apply")->assertStatus(422);
    }

    public function test_only_officers_review_applications(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);

        $this->actingAs($member)->getJson("/api/v1/clans/{$clan->slug}/applications")->assertStatus(403);
    }

    public function test_direct_join_respects_the_recruiting_status(): void
    {
        $owner = User::factory()->create();
        $inviteOnly = $this->clan($owner, ['status' => 'invite_only']);
        $user = User::factory()->create();

        $this->actingAs($user)->postJson("/api/v1/clans/{$inviteOnly->slug}/join")->assertStatus(403);
    }

    public function test_leaving_stops_the_earning_immediately(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);

        $service = app(ClanResourceService::class);
        $service->award($member, 'game_completed');
        $this->assertSame(15, $clan->refresh()->materials);

        $this->actingAs($member)->deleteJson("/api/v1/clans/{$clan->slug}/leave")->assertOk();

        $service->award($member, 'game_completed');
        $this->assertSame(15, $clan->refresh()->materials, 'an ex-member earns the clan nothing');
        $this->assertTrue(ClanActivity::where('type', 'member_left')->where('user_id', $member->id)->exists());
    }

    public function test_the_directory_carries_tier_activity_and_size_and_honors_the_recruiting_filter(): void
    {
        $owner = User::factory()->create();
        $open = $this->clan($owner);
        app(ClanResourceService::class)->award($owner, 'game_completed');

        $closedOwner = User::factory()->create();
        $this->clan($closedOwner, ['status' => 'closed', 'name' => 'Closed Crew', 'slug' => 'closed-crew']);

        $all = $this->getJson('/api/v1/clans')->assertOk()->json('data.data');
        $this->assertCount(2, $all);

        $row = collect($all)->firstWhere('slug', $open->slug);
        $this->assertSame('Outpost', $row['tier_name']);
        $this->assertSame(15, $row['activity_score']);
        $this->assertSame(1, $row['active_members']);
        $this->assertSame('small', $row['size_category']);

        $recruiting = $this->getJson('/api/v1/clans?recruiting=1')->assertOk()->json('data.data');
        $this->assertCount(1, $recruiting);
        $this->assertSame($open->slug, $recruiting[0]['slug']);
    }

    public function test_the_directory_carries_the_spotlight_the_rail_and_pending_invites_list(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner, ['description' => 'Elite competitive clan.', 'region' => 'Europe']);
        app(ClanResourceService::class)->award($owner, 'game_completed');

        $data = $this->getJson('/api/v1/clans')->assertOk()->json('data');

        // Nobody is boosted → the week's top earner takes the spotlight.
        $this->assertSame($clan->slug, $data['spotlight']['slug']);
        $this->assertFalse($data['spotlight']['boosted']);
        $this->assertSame('Outpost', $data['spotlight']['tier_name']);

        $this->assertSame($clan->slug, $data['sidebar']['top_weekly'][0]['slug']);
        $this->assertSame(15, $data['sidebar']['top_weekly'][0]['score']);
        $this->assertSame($clan->slug, $data['sidebar']['recent_active'][0]['slug']);
        $this->assertContains('Europe', $data['sidebar']['regions']);

        // Pending invites finally have a listing endpoint.
        $invitee = User::factory()->create();
        ClanInvite::create([
            'clan_id' => $clan->id, 'inviter_id' => $owner->id, 'invitee_id' => $invitee->id,
            'status' => 'pending', 'expires_at' => now()->addDays(7),
        ]);

        $invites = $this->actingAs($invitee)->getJson('/api/v1/user/clan-invites')->assertOk()->json('data');
        $this->assertCount(1, $invites);
        $this->assertSame($clan->name, $invites[0]['clan']['name']);
    }

    public function test_officers_manage_presentation_but_only_the_owner_renames_the_clan(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner, ['name' => 'Alpha Legion Prime', 'tag' => 'ALPHA']);

        $officer = User::factory()->create();
        ClanMember::create(['clan_id' => $clan->id, 'user_id' => $officer->id, 'role' => 'officer', 'joined_at' => now()]);

        // An officer edits how the clan presents itself…
        $this->actingAs($officer)->putJson("/api/v1/clans/{$clan->slug}", [
            'motto' => 'One Legion. Unbroken.',
            'region' => 'Europe',
            'status' => 'invite_only',
            'name' => 'Officer Rename Attempt',
        ])->assertOk();

        $clan->refresh();
        $this->assertSame('One Legion. Unbroken.', $clan->motto);
        $this->assertSame('invite_only', $clan->status);
        $this->assertSame('Alpha Legion Prime', $clan->name, 'an officer cannot rename the clan');

        // …the owner may also change the identity.
        $this->actingAs($owner)->putJson("/api/v1/clans/{$clan->slug}", ['name' => 'Alpha Legion Reborn'])->assertOk();
        $this->assertSame('Alpha Legion Reborn', $clan->fresh()->name);

        // A plain member manages nothing.
        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);
        $this->actingAs($member)->putJson("/api/v1/clans/{$clan->slug}", ['motto' => 'nope'])->assertStatus(403);
    }

    public function test_uploading_artwork_replaces_the_old_file_and_removing_it_clears_the_field(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $clan = $this->clan($owner);

        $first = $this->actingAs($owner)->post("/api/v1/clans/{$clan->slug}/media", [
            'logo' => UploadedFile::fake()->create('crest.png', 120, 'image/png'),
        ])->assertOk()->json('data.logo');

        Storage::disk('public')->assertExists($first);

        // A second upload replaces the first rather than piling up.
        $second = $this->actingAs($owner)->post("/api/v1/clans/{$clan->slug}/media", [
            'logo' => UploadedFile::fake()->create('crest2.png', 120, 'image/png'),
        ])->assertOk()->json('data.logo');

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertMissing($first);

        $this->actingAs($owner)->deleteJson("/api/v1/clans/{$clan->slug}/media/logo")->assertOk();

        $this->assertNull($clan->fresh()->logo);
        Storage::disk('public')->assertMissing($second);
    }

    public function test_the_profile_roster_carries_contributions_and_the_viewer_their_standing(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        app(ClanResourceService::class)->award($owner, 'game_completed');

        $data = $this->actingAs($owner, 'sanctum')->getJson("/api/v1/clans/{$clan->slug}")->assertOk()->json('data');

        $this->assertSame('owner', $data['roster'][0]['role']);
        $this->assertSame(15, $data['roster'][0]['contribution']);
        $this->assertSame(15, $data['roster'][0]['contribution_week']);
        $this->assertSame($owner->username, $data['top_contributors'][0]['user']['username']);
        $this->assertSame('owner', $data['viewer']['role']);
        $this->assertSame('clan-'.$clan->slug, $data['forum_slug']);

        $stranger = User::factory()->create();
        $viewer = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/clans/{$clan->slug}")->assertOk()->json('data.viewer');
        $this->assertNull($viewer['role']);
        $this->assertFalse($viewer['in_other_clan']);
        $this->assertFalse($viewer['application_pending']);
    }

    public function test_the_clan_profile_carries_the_economy_block(): void
    {
        $owner = User::factory()->create();
        $clan = $this->clan($owner);
        app(ClanResourceService::class)->award($owner, 'game_completed');

        $data = $this->getJson("/api/v1/clans/{$clan->slug}")->assertOk()->json('data');

        $this->assertSame(1, $data['progress']['level']);
        $this->assertSame('Outpost', $data['progress']['tier_name']);
        $this->assertSame(15, $data['resources']['materials']);
        $this->assertSame(1, $data['active_members']);
        $this->assertSame(15, $data['activity_score']);
    }
}
