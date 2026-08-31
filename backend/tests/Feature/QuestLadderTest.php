<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\Giveaway;
use App\Models\GiveawayEntry;
use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\User;
use App\Services\QuestService;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The ladder a member climbs, and the three things that stopped it working.
 *
 * Measured on production first: 45 of 55 members had zero XP, and the quests
 * asking for ratings and forum replies covered two acts nobody had ever
 * performed, while the two widest doors into the site — linking a library and
 * entering a giveaway — awarded nothing at all.
 */
class QuestLadderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The migrated catalogue is switched off first.
     *
     * The ladder migration seeds real quests, and several of them share a
     * criteria with the ones written here — advancing `game_added` would
     * complete First Game and Add a Game as well, and the XP assertion would be
     * measuring three quests instead of one.
     */
    protected function setUp(): void
    {
        parent::setUp();
        Quest::query()->update(['is_active' => false]);
    }

    private function quest(array $overrides = []): Quest
    {
        return Quest::create($overrides + [
            'name' => 'Test quest',
            'description' => 'A quest.',
            'type' => 'permanent',
            'criteria_type' => 'game_added',
            'criteria_value' => 1,
            'xp_reward' => 0,
            'bounty_reward' => 0,
            'is_active' => true,
        ]);
    }

    // ── The daily cap ───────────────────────────────────────────────────────

    /**
     * The reason every reward in the old catalogue was a half-truth.
     */
    #[Test]
    public function a_quest_pays_in_full_past_the_daily_cap(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        $this->quest(['criteria_value' => 1, 'xp_reward' => 400]);

        // Burn the whole daily allowance on something that is capped.
        app(XpService::class)->awardXp($user, XpService::DAILY_XP_CAP, 'game_added');
        $this->assertSame(XpService::DAILY_XP_CAP, $user->fresh()->xp);

        app(QuestService::class)->progress($user, 'game_added');

        // 100 from the capped award, then the quest's 400 on top of it.
        $this->assertSame(XpService::DAILY_XP_CAP + 400, $user->fresh()->xp);
    }

    /**
     * And everything else still respects it, which is what the cap is for.
     */
    #[Test]
    public function ordinary_awards_are_still_capped(): void
    {
        $user = User::factory()->create(['xp' => 0]);

        app(XpService::class)->awardXp($user, 90, 'game_added');
        app(XpService::class)->awardXp($user, 90, 'game_added');

        $this->assertSame(XpService::DAILY_XP_CAP, $user->fresh()->xp);
    }

    // ── New hooks ───────────────────────────────────────────────────────────

    #[Test]
    public function linking_a_library_moves_a_quest(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'platform_connected', 'criteria_value' => 1]);

        ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198000000002',
            'display_name' => 'Someone',
        ]);

        $progress = QuestProgress::where('user_id', $user->id)->where('quest_id', $quest->id)->first();

        $this->assertNotNull($progress, 'connecting a platform should count');
        $this->assertNotNull($progress->completed_at);
    }

    /**
     * Reconnecting the same account must not pay twice — the observer listens
     * for `created`, and a re-link updates the row it already has.
     */
    #[Test]
    public function relinking_the_same_account_does_not_pay_again(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'platform_connected', 'criteria_value' => 5]);

        $account = ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198000000002',
            'display_name' => 'Someone',
        ]);
        $account->update(['display_name' => 'Someone Else']);

        $this->assertSame(1, (int) QuestProgress::where('quest_id', $quest->id)->value('progress'));
    }

    #[Test]
    public function entering_a_giveaway_moves_a_quest(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'giveaway_entered', 'criteria_value' => 1]);

        $giveaway = Giveaway::create([
            'title' => 'A keyboard',
            'slug' => 'a-keyboard',
            'prize_name' => 'Keyboard',
            'status' => 'active',
            'created_by' => User::factory()->create()->id,
        ]);

        GiveawayEntry::create(['user_id' => $user->id, 'giveaway_id' => $giveaway->id]);

        $this->assertNotNull(
            QuestProgress::where('user_id', $user->id)->where('quest_id', $quest->id)->first(),
            'the most-used feature on the site should count for something'
        );
    }

    // ── list_published on creation ──────────────────────────────────────────

    /**
     * A list created straight from the form is public the moment it exists and
     * never passes through the draft→public transition the hook watched.
     */
    #[Test]
    public function a_list_born_published_counts(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'list_published', 'criteria_value' => 1]);

        $this->actingAs($user)
            ->postJson('/api/v1/game-lists', ['name' => 'Best of 2026', 'is_public' => true])
            ->assertSuccessful();

        $this->assertNotNull(
            QuestProgress::where('user_id', $user->id)->where('quest_id', $quest->id)->first()
        );
    }

    #[Test]
    public function a_draft_does_not_count_until_it_is_published(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'list_published', 'criteria_value' => 1]);

        $this->actingAs($user)
            ->postJson('/api/v1/game-lists', ['name' => 'Not ready', 'is_draft' => true])
            ->assertSuccessful();

        $this->assertNull(QuestProgress::where('quest_id', $quest->id)->first(), 'a draft is a note to yourself');
    }

    // ── session_logged after validation ─────────────────────────────────────

    /**
     * The hook was the first line of the method, before `validate()`.
     */
    #[Test]
    public function a_rejected_session_does_not_move_the_quest(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'session_logged', 'criteria_value' => 3]);

        $this->actingAs($user)
            ->postJson('/api/v1/journal/sessions', ['game_slug' => ''])
            ->assertStatus(422);

        $this->assertNull(QuestProgress::where('quest_id', $quest->id)->first());
    }

    #[Test]
    public function a_real_session_does(): void
    {
        $user = User::factory()->create();
        $quest = $this->quest(['criteria_type' => 'session_logged', 'criteria_value' => 3]);
        Game::create([
            'slug' => 'quake-champions', 'name' => 'Quake Champions', 'released' => '2017-08-22',
            'genres' => ['Shooter'], 'platforms' => ['PC'], 'tags' => [],
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/journal/sessions', [
                'game_slug' => 'quake-champions',
                'played_on' => now()->toDateString(),
                'minutes' => 45,
            ])
            ->assertSuccessful();

        $this->assertSame(1, (int) QuestProgress::where('quest_id', $quest->id)->value('progress'));
    }
}
