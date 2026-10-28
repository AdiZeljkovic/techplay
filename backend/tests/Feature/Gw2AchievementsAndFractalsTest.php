<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\Advisor\Achievements;
use App\Services\Gw2\Advisor\DailyFractals;
use App\Services\Gw2\Advisor\Dashboard;
use App\Services\Gw2\Advisor\Fractals;
use App\Services\Gw2\Gw2Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The two pages the mockup's menu has and its pictures never drew —
 * achievements and fractals (phase 6 of gw2/REDIZAJN.md).
 *
 * The fixture has one of everything the sums have to treat differently: a
 * tiered achievement part-way up its ladder, a hidden one not yet found, a
 * repeatable one with a cap and one whose cap the catalogue does not hold, the
 * day's fractal dailies, and a retired event in the Historical group.
 */
class Gw2AchievementsAndFractalsTest extends TestCase
{
    use RefreshDatabase;

    private const GENERAL = '56A82BB9-6B07-4AB0-89EE-E4A6D68F5C47';

    private const DAILY = '18DB115A-8637-4290-A636-821362A3C4A8';

    private int $accountId;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // A Wednesday. The game's week began on Monday at 07:30 UTC.
        $this->travelTo(Carbon::parse('2026-10-28 12:00:00', 'UTC'));

        $this->seedCatalogue();
        $this->accountId = $this->seedAccount();
    }

    public function test_points_are_summed_from_tiers_repeats_and_the_daily_count(): void
    {
        $page = app(Dashboard::class)->achievements($this->accountId);

        /*
         * Centaur Slayer at 150 has banked two tiers (1 + 5). Party Commander,
         * four runs at 10, is under its cap of 100. Group Effort ran three
         * times but its cap is not in the catalogue, so it counts once. The
         * fractal one is done (1), the retired event too (10), and the daily
         * done today pays into daily_ap, not here.
         */
        $this->assertSame(6 + 40 + 2 + 1 + 10, $page['points']['from_achievements']);
        $this->assertSame(59 + 270 + 5, $page['points']['total']);
        $this->assertSame(1, $page['points']['repeats_uncapped']);

        // Done, leaving out what resets.
        $this->assertSame(4, $page['done']);
    }

    public function test_groups_follow_the_game_and_count_only_what_can_be_seen_and_kept(): void
    {
        $groups = collect(app(Dashboard::class)->achievements($this->accountId)['groups'])->keyBy('id');

        // The daily group is all resetting achievements, so it is not a group here.
        $this->assertSame([self::GENERAL, Achievements::FRACTALS, Achievements::HISTORICAL], $groups->keys()->all());

        // The hidden achievement nobody has found is not in the denominator.
        $this->assertSame(2, $groups[self::GENERAL]['done']);
        $this->assertSame(3, $groups[self::GENERAL]['total']);
        $this->assertSame(48, $groups[self::GENERAL]['points']);

        // A retired group says what was done and claims no total.
        $this->assertTrue($groups[Achievements::HISTORICAL]['retired']);
        $this->assertSame(1, $groups[Achievements::HISTORICAL]['done']);
        $this->assertNull($groups[Achievements::HISTORICAL]['total']);
    }

    public function test_recent_completions_leave_out_dailies_and_count_by_game_week(): void
    {
        $page = app(Dashboard::class)->achievements($this->accountId);

        $this->assertSame([0, 0, 0, 0, 1, 1], array_column($page['recent']['weeks'], 'count'));
        $this->assertSame(1, $page['recent']['this_week']);
        $this->assertSame('Fractal Initiate', $page['recent']['events'][0]['name']);
        // No icon of its own; its category's.
        $this->assertSame('fractals.png', $page['recent']['events'][0]['icon']);

        $this->assertSame('Fractal Savant', $page['closest'][0]['name']);
        $this->assertSame('Fractal Savant', $page['titles'][0]['achievement']);
    }

    public function test_daily_fractals_are_grouped_and_yesterdays_tomorrow_stands_in_for_a_missed_read(): void
    {
        $api = $this->createMock(Gw2Client::class);
        $api->method('public')->willReturn([
            'id' => 88,
            'achievements' => [['id' => 104], ['id' => 105], ['id' => 106]],
            'tomorrow' => [['id' => 107]],
        ]);

        $daily = app(DailyFractals::class);
        $this->assertSame(3, $daily->refresh($api));

        $today = $daily->read()['today'];
        $this->assertSame([['name' => 'Aetherblade', 'tiers' => [1, 4]]], $today['fractals']);
        $this->assertSame([28], $today['recommended']);
        $this->assertSame([['name' => 'Chaos', 'tiers' => [4]]], $daily->read()['tomorrow']['fractals']);

        // The next night's read failed: tomorrow is today now, and two days on there is nothing.
        $this->travelTo(Carbon::parse('2026-10-29 09:00:00', 'UTC'));
        $this->assertSame('Chaos', $daily->read()['today']['fractals'][0]['name']);
        $this->assertNull($daily->read()['tomorrow']);

        $this->travelTo(Carbon::parse('2026-10-30 09:00:00', 'UTC'));
        $this->assertNull($daily->read());
    }

    public function test_the_fractals_page_reads_level_agony_attunement_and_currencies(): void
    {
        $page = app(Dashboard::class)->fractals($this->accountId);

        // Level 37 is Tier 2 — the mockup's "Tier 4" was wrong.
        $this->assertSame(37, $page['personal_level']);
        $this->assertSame(2, $page['tier']);
        $this->assertSame(1, Fractals::tier(25));
        $this->assertSame(2, Fractals::tier(26));
        $this->assertSame(4, Fractals::tier(100));
        $this->assertNull(Fractals::tier(0));

        // Summed from the infusions worn, most first; the level 40 is not listed.
        $this->assertSame(['Isara Moonbloom', 'Varo'], array_column($page['characters'], 'name'));
        $this->assertSame(20, $page['characters'][0]['agony_resistance']);
        $this->assertSame(130, $page['character']['shortfall']);

        $this->assertSame(2, $page['attunement']['paid']);
        $this->assertSame(4, $page['attunement']['total']);
        $this->assertSame('Recursive Resourcing', $page['attunement']['tiers'][2]['name']);
        $this->assertFalse($page['attunement']['tiers'][2]['paid']);

        $this->assertSame(['Fractal Relic', 'Pristine Fractal Relic'], array_column($page['wallet'], 'name'));
        $this->assertSame(1200, $page['wallet'][0]['amount']);

        // The group and the near finish are the fractal ones only.
        $this->assertSame('Fractals of the Mists', $page['achievements']['name']);
        $this->assertSame(['Fractal Savant'], array_column($page['closest'], 'name'));
        $this->assertSame(['/gw2/fractals/agony-resistance'], array_column($page['guides'], 'href'));
    }

    public function test_the_endpoints_answer_for_the_owner_and_refuse_a_stranger(): void
    {
        $this->actingAs($this->user)->getJson('/api/v1/gw2/achievements')
            ->assertOk()
            ->assertJsonPath('data.points.total', 334);

        $this->actingAs($this->user)->getJson('/api/v1/gw2/fractals?character=Varo')
            ->assertOk()
            ->assertJsonPath('data.character.name', 'Varo')
            ->assertJsonPath('data.character.agony_resistance', 0);

        $this->actingAs($this->user)->getJson('/api/v1/gw2/fractals?character=Nobody')->assertNotFound();

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->getJson('/api/v1/gw2/fractals')->assertNotFound();
    }

    private function seedCatalogue(): void
    {
        $achievements = [
            // id, name, tiers, flags, cap, category, icon
            [101, 'Centaur Slayer', [[10, 1], [100, 5], [500, 10]], ['Permanent'], null, 1, 'slayer.png'],
            [102, 'Something Hidden', [[1, 5]], ['Hidden'], null, 1, null],
            [103, 'Party Commander', [[5, 10]], ['Repeatable'], 100, 1, null],
            [108, 'Group Effort', [[1, 2]], ['Repeatable'], null, 1, null],
            [104, 'Daily Tier 4 Aetherblade', [[1, 0]], ['Daily'], null, 88, null],
            [105, 'Daily Tier 1 Aetherblade', [[1, 0]], ['Daily'], null, 88, null],
            [106, 'Daily Recommended Fractal—Scale 28', [[1, 0]], ['Daily'], null, 88, null],
            [107, 'Daily Tier 4 Chaos', [[1, 0]], ['Daily'], null, 88, null],
            [201, 'Fractal Savant', [[50, 5]], ['Permanent'], null, 30, null],
            [202, 'Fractal Initiate', [[1, 1]], ['Permanent'], null, 30, null],
            [301, 'Old Festival', [[1, 10]], ['Permanent'], null, 400, null],
            [302, 'Older Festival', [[1, 10]], ['Permanent'], null, 400, null],
        ];

        foreach ($achievements as [$id, $name, $tiers, $flags, $cap, $category, $icon]) {
            DB::table('gw2_achievements')->insert([
                'id' => $id, 'name' => $name, 'type' => 'Default',
                'tiers' => json_encode(array_map(fn ($t) => ['count' => $t[0], 'points' => $t[1]], $tiers)),
                'flags' => json_encode($flags), 'point_cap' => $cap, 'category_id' => $category, 'icon' => $icon,
            ]);
        }

        $reference = fn (string $kind, int|string $id, string $name, array $payload) => DB::table('gw2_reference')->insert([
            'kind' => $kind, 'ref_id' => is_int($id) ? $id : crc32($id), 'name' => $name,
            'payload' => json_encode(['id' => $id, 'name' => $name] + $payload),
        ]);

        $reference('achievements_categories', 1, 'Slayer', ['order' => 1, 'icon' => 'slayer-cat.png', 'achievements' => [101, 102, 103, 108]]);
        $reference('achievements_categories', 88, 'Daily Fractals', ['order' => 2, 'icon' => 'daily.png', 'achievements' => [104, 105, 106, 107]]);
        $reference('achievements_categories', 30, 'Fractals of the Mists', ['order' => 1, 'icon' => 'fractals.png', 'achievements' => [201, 202]]);
        $reference('achievements_categories', 400, 'Old Festival', ['order' => 1, 'icon' => 'old.png', 'achievements' => [301, 302]]);

        $reference('achievements_groups', self::DAILY, 'Daily', ['order' => 1, 'categories' => [88]]);
        $reference('achievements_groups', self::GENERAL, 'General', ['order' => 6, 'categories' => [1]]);
        $reference('achievements_groups', Achievements::FRACTALS, 'Fractals of the Mists', ['order' => 23, 'categories' => [30]]);
        $reference('achievements_groups', Achievements::HISTORICAL, 'Historical', ['order' => 99, 'categories' => [400]]);

        $reference('titles', 1, 'Savant', ['achievements' => [201]]);

        $reference('currencies', 7, 'Fractal Relic', ['icon' => 'relic.png']);
        $reference('currencies', 24, 'Pristine Fractal Relic', ['icon' => 'pristine.png']);
        $reference('currencies', 1, 'Coin', []);

        DB::table('gw2_masteries')->insert([
            'id' => 5, 'name' => 'Fractal Attunement', 'region' => 'Tyria', 'order' => 1,
            'levels' => json_encode(array_map(fn ($l) => ['name' => $l[0], 'point_cost' => $l[1], 'description' => $l[0].' does a thing.'], [
                ['Follows Advice', 1], ['Agony Channeler', 2], ['Recursive Resourcing', 3], ['Mistlock Singularities', 5],
            ])),
        ]);

        // A +10 agony infusion, read by its attribute rather than its name.
        DB::table('gw2_items')->insert([
            ['id' => 5001, 'name' => '+10 Agony Infusion', 'type' => 'UpgradeComponent', 'rarity' => 'Ascended', 'level' => 0,
                'details' => json_encode(['infix_upgrade' => ['attributes' => [['attribute' => 'AgonyResistance', 'modifier' => 10]]]])],
            ['id' => 5002, 'name' => 'Ascended Ring', 'type' => 'Trinket', 'rarity' => 'Ascended', 'level' => 80, 'details' => json_encode([])],
        ]);

        DB::table('gw2_guides')->insert([
            ['family' => 'fractals', 'slug' => 'agony-resistance', 'title' => 'Agony Resistance', 'is_published' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['family' => 'fractals', 'slug' => 'draft', 'title' => 'Not yet', 'is_published' => false, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    private function seedAccount(): int
    {
        $this->user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $this->user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression', 'characters', 'unlocks', 'wallet'],
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $this->user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'fractal_level' => 37,
            'daily_ap' => 270,
            'monthly_ap' => 5,
            'access' => json_encode(['GuildWars2']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ring = ['id' => 5002, 'slot' => 'Ring1', 'infusions' => [5001, 5001]];

        foreach ([['Isara Moonbloom', 80, [$ring]], ['Varo', 80, []], ['Tiny', 40, []]] as [$name, $level, $equipment]) {
            DB::table('gw2_characters')->insert([
                'gw2_account_id' => $accountId, 'name' => $name, 'profession' => 'Thief', 'level' => $level,
                'equipment' => json_encode($equipment), 'observed_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $accountId,
            'achievements' => json_encode([
                ['id' => 101, 'current' => 150, 'max' => 500, 'done' => false],
                ['id' => 103, 'current' => 2, 'max' => 5, 'done' => true, 'repeated' => 4],
                ['id' => 108, 'current' => 0, 'max' => 1, 'done' => true, 'repeated' => 3],
                ['id' => 104, 'current' => 1, 'max' => 1, 'done' => true],
                ['id' => 201, 'current' => 45, 'max' => 50, 'done' => false],
                ['id' => 202, 'current' => 1, 'max' => 1, 'done' => true],
                ['id' => 301, 'current' => 1, 'max' => 1, 'done' => true],
            ]),
            'masteries' => json_encode([['id' => 5, 'region' => 'Tyria', 'level' => 1]]),
            'wallet' => json_encode([['id' => 7, 'value' => 1200], ['id' => 24, 'value' => 3]]),
            'unlocks' => json_encode(['titles' => []]),
            'observed_at' => now(),
        ]);

        DB::table('gw2_progress_events')->insert([
            ['gw2_account_id' => $accountId, 'type' => 'achievement_completed', 'occurred_at' => '2026-10-27 10:00:00', 'payload' => json_encode(['id' => 202])],
            // A daily, done again every day — not news.
            ['gw2_account_id' => $accountId, 'type' => 'achievement_completed', 'occurred_at' => '2026-10-27 11:00:00', 'payload' => json_encode(['id' => 104])],
            ['gw2_account_id' => $accountId, 'type' => 'achievement_completed', 'occurred_at' => '2026-10-20 10:00:00', 'payload' => json_encode(['id' => 301])],
        ]);

        return $accountId;
    }
}
