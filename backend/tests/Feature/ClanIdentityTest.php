<?php

namespace Tests\Feature;

use App\Models\Clan;
use App\Models\ClanBuilding;
use App\Models\ClanMember;
use App\Models\ClanPoll;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\ClanResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClanIdentityTest extends TestCase
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

    private function building(string $key, int $level): void
    {
        ClanBuilding::updateOrCreate(['clan_id' => $this->clan->id, 'key' => $key], ['level' => $level]);
        Cache::forget("clan.buildings.{$this->clan->id}");
    }

    private function base(): array
    {
        return $this->actingAs($this->owner)->getJson('/api/v1/clans/alpha-legion/base')->assertOk()->json('data');
    }

    /* ── Clan DNA ─────────────────────────────────────────────────────── */

    public function test_clan_dna_stays_locked_until_the_archive_stands(): void
    {
        $this->assertNull($this->base()['dna']);

        $this->building('archive', 1);
        $this->assertNotNull($this->base()['dna']);
    }

    public function test_clan_dna_aggregates_the_whole_roster_and_names_the_clan(): void
    {
        $this->building('archive', 1);

        $second = User::factory()->create();
        ClanMember::create(['clan_id' => $this->clan->id, 'user_id' => $second->id, 'role' => 'member', 'joined_at' => now()]);

        static $n = 0;
        $make = function (array $genres, string $released) use (&$n) {
            $n++;

            return Game::create(['slug' => "dna-{$n}", 'name' => "DNA {$n}", 'genres' => $genres, 'released' => $released]);
        };

        // Owner: three completed strategy games; member: one action backlog title.
        foreach (range(1, 3) as $_) {
            UserGame::create(['user_id' => $this->owner->id, 'game_id' => $make(['Strategy / tactics'], '2018-01-01')->id, 'status' => 'completed']);
        }
        UserGame::create(['user_id' => $second->id, 'game_id' => $make(['Action'], '1997-05-01')->id, 'status' => 'backlog']);

        $dna = $this->base()['dna'];

        $this->assertSame('Strategy / tactics', $dna['genres'][0]['name']);
        $this->assertSame(75, $dna['genres'][0]['percent']);
        $this->assertSame(4, $dna['games']);
        $this->assertSame(75, $dna['completion_rate']);
        $this->assertSame('Relentless Tacticians', $dna['dominant_archetype']);

        $eras = collect($dna['eras'])->keyBy('key');
        $this->assertSame(75, $eras['ps4']['percent']);
        $this->assertSame(25, $eras['retro']['percent']);
    }

    /* ── Workshop themes ──────────────────────────────────────────────── */

    public function test_a_theme_needs_the_workshop_level_and_the_prestige_behind_it(): void
    {
        // No workshop → even the entry theme is locked.
        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/theme', ['key' => 'ember'])
            ->assertStatus(422);

        $this->building('workshop', 1);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/theme', ['key' => 'ember'])
            ->assertOk();

        $this->assertSame('ember', $this->clan->fresh()->equipped_theme);

        // Neon Grid needs 500 lifetime Prestige on top of Workshop 1.
        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/theme', ['key' => 'cyan'])
            ->assertStatus(422);

        app(ClanResourceService::class)->grant($this->clan, 'prestige', 500, 'test_seed');

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/theme', ['key' => 'cyan'])
            ->assertOk();

        // The profile now carries the theme colour.
        $this->assertSame('#22d3ee', $this->getJson('/api/v1/clans/alpha-legion')->assertOk()->json('data.theme_color'));
    }

    public function test_the_theme_catalog_reports_what_is_reachable(): void
    {
        $this->building('workshop', 1);

        $themes = $this->base()['themes'];

        $this->assertSame(1, $themes['workshop_level']);
        $catalog = collect($themes['catalog'])->keyBy('key');
        $this->assertTrue($catalog['ember']['unlocked']);
        $this->assertFalse($catalog['cyan']['unlocked'], 'prestige requirement holds');
        $this->assertFalse($catalog['gold']['unlocked']);
    }

    /* ── polls ────────────────────────────────────────────────────────── */

    public function test_polls_need_the_communications_hub(): void
    {
        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/polls', [
                'question' => 'Game of the Month?',
                'options' => ['Hades', 'Celeste'],
            ])
            ->assertStatus(422);

        $this->building('communications_hub', 1);

        $this->actingAs($this->owner)
            ->postJson('/api/v1/clans/alpha-legion/base/polls', [
                'question' => 'Game of the Month?',
                'options' => ['Hades', 'Celeste'],
            ])
            ->assertOk();
    }

    public function test_members_vote_once_and_can_change_their_mind(): void
    {
        $this->building('communications_hub', 1);

        $poll = ClanPoll::create([
            'clan_id' => $this->clan->id,
            'question' => 'Next operation?',
            'options' => ['RPG Month', 'Backlog Purge'],
            'ends_at' => now()->addDays(3),
        ]);

        $member = User::factory()->create();
        ClanMember::create(['clan_id' => $this->clan->id, 'user_id' => $member->id, 'role' => 'member', 'joined_at' => now()]);

        $this->actingAs($member)->postJson("/api/v1/clans/polls/{$poll->id}/vote", ['option' => 0])->assertOk();
        $this->actingAs($member)->postJson("/api/v1/clans/polls/{$poll->id}/vote", ['option' => 1])->assertOk();

        $this->assertSame(1, $poll->votes()->count(), 'a changed mind is still one vote');
        $this->assertSame(1, $poll->votes()->first()->option);

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->postJson("/api/v1/clans/polls/{$poll->id}/vote", ['option' => 0])->assertStatus(403);

        // The panel reports the tally and the viewer's own vote.
        $panel = $this->actingAs($member)->getJson('/api/v1/clans/alpha-legion/base')->assertOk()->json('data.polls');
        $this->assertTrue($panel['enabled']);
        $this->assertSame(1, $panel['items'][0]['my_vote']);
        $this->assertSame(100, $panel['items'][0]['options'][1]['percent']);
    }

    public function test_a_closed_poll_takes_no_votes(): void
    {
        $poll = ClanPoll::create([
            'clan_id' => $this->clan->id,
            'question' => 'Too late?',
            'options' => ['Yes', 'No'],
            'ends_at' => now()->subHour(),
        ]);

        $this->actingAs($this->owner)->postJson("/api/v1/clans/polls/{$poll->id}/vote", ['option' => 0])->assertStatus(422);
    }
}
