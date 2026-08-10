<?php

namespace Tests\Feature;

use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\Rank;
use App\Models\Season;
use App\Models\User;
use App\Notifications\RankUpNotification;
use App\Services\QuestService;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * P4 unit two: XP, ranks, quests and seasons.
 *
 * The progression system is the retention core and the thing people notice
 * being wrong, so the tests here are mostly about the ways it could be paid out
 * twice or never stop.
 */
class ProgressionEconomyTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_daily_cap_holds_and_the_counter_expires(): void
    {
        $user = User::factory()->create(['xp' => 0]);
        $xp = app(XpService::class);

        // Well past the 100/day ceiling.
        for ($i = 0; $i < 30; $i++) {
            $xp->awardXp($user, 15, 'game_added');
        }

        $this->assertSame(XpService::DAILY_XP_CAP, (int) $user->fresh()->xp);

        // The counter used to be created by a bare Redis INCRBY, which sets no
        // expiry — one permanent key per user per day, accumulating forever.
        $key = "user:{$user->id}:xp:".now()->format('Y-m-d');
        $this->assertSame(XpService::DAILY_XP_CAP, (int) Cache::get($key));

        $this->travel(1)->days();
        $this->assertNull(Cache::get($key), 'the daily counter must not outlive the day');
    }

    public function test_xp_is_not_mass_assignable(): void
    {
        $user = User::factory()->create(['xp' => 10]);

        // One careless $user->update($validated) would otherwise be free money.
        $user->update(['xp' => 999999, 'bounty_balance' => 999999, 'forum_reputation' => 999999]);

        $fresh = $user->fresh();
        $this->assertSame(10, (int) $fresh->xp);
        $this->assertNotSame(999999, (int) $fresh->bounty_balance);
        $this->assertNotSame(999999, (int) $fresh->forum_reputation);
    }

    public function test_a_quest_pays_out_once_even_when_the_trigger_fires_twice(): void
    {
        $user = User::factory()->create(['xp' => 0, 'bounty_balance' => 0]);

        $quest = Quest::create([
            'name' => 'Add a game',
            'slug' => 'add-a-game',
            'description' => 'Add one game to your collection.',
            'type' => 'permanent',
            'criteria_type' => 'games_added',
            'criteria_value' => 1,
            'xp_reward' => 20,
            'bounty_reward' => 50,
            'is_active' => true,
        ]);

        $quests = app(QuestService::class);
        $quests->progress($user, 'games_added');
        $quests->progress($user, 'games_added');
        $quests->progress($user, 'games_added');

        $entry = QuestProgress::where('user_id', $user->id)->where('quest_id', $quest->id)->first();

        $this->assertNotNull($entry->completed_at);
        $this->assertSame(1, (int) $entry->progress);
        // 20 XP once, not once per trigger.
        $this->assertSame(20, (int) $user->fresh()->xp);
        $this->assertSame(50, (int) $user->fresh()->bounty_balance);
    }

    public function test_a_season_stops_applying_once_its_end_date_passes(): void
    {
        Cache::flush();

        // A migration seeds a season, and this test is about which one wins.
        Season::query()->delete();

        Season::create([
            'name' => 'Winter',
            'slug' => 'winter',
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subDay(),
            'is_active' => true,          // conclude has not run yet
            'xp_multiplier' => 3.0,
            'bounty_multiplier' => 3.0,
        ]);

        // is_active alone used to be enough, so a season kept tripling awards
        // between its end date and whenever the nightly command next ran — or
        // forever, if the scheduler was down.
        $this->assertNull(Season::active());
        $this->assertSame(1.0, Season::multipliers()['xp']);

        // The command that closes it must still be able to find it.
        $this->assertNotNull(Season::flaggedActive());
    }

    public function test_dropping_down_the_ladder_is_not_announced_as_a_promotion(): void
    {
        Notification::fake();

        $bronze = Rank::create(['name' => 'Bronze', 'slug' => 'bronze', 'min_xp' => 0]);
        $gold = Rank::create(['name' => 'Gold', 'slug' => 'gold', 'min_xp' => 1000]);

        // Sitting on Gold with Bronze-level XP — what happens when the ladder
        // is re-thresholded in the admin panel.
        $user = User::factory()->create(['xp' => 50, 'rank_id' => $gold->id]);

        app(XpService::class)->awardXp($user, 5, 'article_read');

        $this->assertSame($bronze->id, $user->fresh()->rank_id, 'the rank should follow the ladder');
        Notification::assertNotSentTo($user, RankUpNotification::class);
    }

    public function test_climbing_the_ladder_is_announced(): void
    {
        Notification::fake();

        $bronze = Rank::create(['name' => 'Bronze', 'slug' => 'bronze', 'min_xp' => 0]);
        Rank::create(['name' => 'Silver', 'slug' => 'silver', 'min_xp' => 50]);

        $user = User::factory()->create(['xp' => 45, 'rank_id' => $bronze->id]);

        app(XpService::class)->awardXp($user, 10, 'article_read');

        Notification::assertSentTo($user, RankUpNotification::class);
    }
}
