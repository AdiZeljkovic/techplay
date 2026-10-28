<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\AccountSync;
use App\Services\Gw2\Advisor\Collections;
use App\Services\Gw2\Advisor\DailyChecklist;
use App\Services\Gw2\Advisor\Dashboard;
use App\Services\Gw2\Advisor\LegendaryArmory;
use App\Services\Gw2\Advisor\Ownership;
use App\Services\Gw2\Advisor\SnapshotReader;
use App\Services\Gw2\Advisor\TradingPost;
use App\Services\Gw2\Advisor\VaultSeason;
use App\Services\Gw2\CatalogueSync;
use App\Services\Gw2\ForgeDataset;
use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2Connection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The fourteen-point plan of 28 October 2026, one behaviour per test.
 *
 * Each test pins the claim the feature makes to a reader — a price with its
 * date, a reward still under its limit, a forge recipe that counts only once
 * checked — rather than the shape of a payload.
 */
class Gw2PlanItemsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_recipe_prices_are_read_outside_the_cache_and_say_when_they_are_old(): void
    {
        $this->items([[100, 'Ascended Thing'], [200, 'Deldrimor Steel Ingot']]);
        $this->recipe(1, 100, [[200, 2]]);

        $this->assertNull($this->getJson('/api/v1/gw2/public/recipe/100')->json('data.prices'));

        // Prices arrive after the recipe page is already cached for a day.
        DB::table('gw2_item_prices')->insert([
            ['item_id' => 200, 'sell_unit' => 50, 'buy_unit' => 40, 'sell_quantity' => 10, 'buy_quantity' => 10, 'observed_at' => now()->subDays(5)],
            ['item_id' => 100, 'sell_unit' => 1000, 'buy_unit' => 900, 'sell_quantity' => 1, 'buy_quantity' => 1, 'observed_at' => now()->subDays(5)],
        ]);

        $prices = $this->getJson('/api/v1/gw2/public/recipe/100')->assertOk()->json('data.prices');

        $this->assertSame(100, $prices['materials']['buy_now'], 'two ingots at 50');
        $this->assertSame(80, $prices['materials']['bid_and_wait']);
        $this->assertSame(1000, $prices['item']['sell_unit']);
        $this->assertTrue($prices['stale'], 'five days old is past the three-day line');
    }

    public function test_the_vault_shelf_lists_only_limited_rewards_still_under_their_limit(): void
    {
        $this->items([[300, 'Featured Skin'], [301, 'Bought Out'], [302, 'Coins']]);
        DB::table('gw2_reference')->insert([
            'kind' => 'wizardsvault', 'ref_id' => 1, 'name' => 'Code of Creation Season',
            'payload' => json_encode(['title' => 'Code of Creation Season', 'end' => '2026-12-08T17:00:00Z']),
        ]);

        $id = $this->account(state: [
            'wallet' => json_encode([['id' => VaultSeason::ACCLAIM, 'value' => 500]]),
            'vault_listings' => json_encode([
                ['id' => 1, 'item_id' => 300, 'item_count' => 1, 'type' => 'Featured', 'cost' => 450, 'purchased' => 0, 'purchase_limit' => 1],
                ['id' => 2, 'item_id' => 301, 'item_count' => 1, 'type' => 'Normal', 'cost' => 20, 'purchased' => 5, 'purchase_limit' => 5],
                // Unlimited: no limit fields at all.
                ['id' => 3, 'item_id' => 302, 'item_count' => 1, 'type' => 'Normal', 'cost' => 30],
            ]),
        ]);

        $season = app(VaultSeason::class)->for(app(SnapshotReader::class)->for($id));

        $this->assertSame(500, $season['acclaim']);
        $this->assertCount(1, $season['still_to_buy']['listings']);
        $this->assertSame('Featured Skin', $season['still_to_buy']['listings'][0]['name']);
        $this->assertTrue($season['still_to_buy']['listings'][0]['affordable']);
        $this->assertSame(450, $season['still_to_buy']['cost_of_everything']);
        $this->assertNotEmpty($season['notes'], 'the season-end claims carry their sources');

        DB::table('gw2_account_state')->where('gw2_account_id', $id)->update(['vault_listings' => null]);

        // Never read is not "everything bought".
        $this->assertNull(app(VaultSeason::class)->for(app(SnapshotReader::class)->for($id))['still_to_buy']);
    }

    public function test_the_daily_list_resets_where_the_read_belongs_not_where_the_page_is(): void
    {
        foreach (['amnytas_heros_choice_chest', 'auric_basin_heros_choice_chest'] as $chest) {
            DB::table('gw2_reference')->insert(['kind' => 'mapchests', 'ref_id' => crc32($chest), 'name' => $chest, 'payload' => json_encode(['id' => $chest])]);
        }

        // Read at 22:30 UTC on the 28th; the page is built after midnight.
        $id = $this->account(state: [
            'map_chests' => json_encode(['auric_basin_heros_choice_chest']),
            'observed_at' => Carbon::parse('2026-10-28 22:30:00', 'UTC')->setTimezone(config('app.timezone')),
        ]);
        Carbon::setTestNow(Carbon::parse('2026-10-29 01:00:00', 'UTC'));

        $today = app(DailyChecklist::class)->for(app(SnapshotReader::class)->for($id));

        $this->assertSame('2026-10-29T00:00:00+00:00', $today['daily_reset_at'], 'the midnight that closed the read');
        $this->assertSame(1, $today['daily']['heros_choice_chests']['done']);
        $this->assertSame(2, $today['daily']['heros_choice_chests']['total']);
        $this->assertNull($today['daily']['time_gated_crafts'], 'never read is not none crafted');

        // Monday 07:30 UTC: before it, the same day; after it, the next week.
        $this->assertSame('2026-11-02 07:30', DailyChecklist::nextWeeklyReset(Carbon::parse('2026-11-02 07:00', 'UTC'))->format('Y-m-d H:i'));
        $this->assertSame('2026-11-09 07:30', DailyChecklist::nextWeeklyReset(Carbon::parse('2026-11-02 08:00', 'UTC'))->format('Y-m-d H:i'));
    }

    public function test_a_recipe_taught_by_a_sheet_is_named_until_the_account_has_learned_it(): void
    {
        $this->items([[100, 'Ascended Chestpiece'], [200, 'Deldrimor Steel Ingot'], [300, 'Mithril Ore']]);
        $this->recipe(1, 100, [[200, 1]], ['LearnedFromItem']);
        $this->recipe(2, 200, [[300, 1]], ['AutoLearned']);

        $id = $this->account(state: ['unlocks' => json_encode(['recipes' => []])]);

        $plan = app(Dashboard::class)->plan($id, 100, 1);
        $this->assertSame([1], array_column($plan['recipes_to_learn'], 'recipe_id'), 'the sheet recipe only');

        DB::table('gw2_account_state')->where('gw2_account_id', $id)->update(['unlocks' => json_encode(['recipes' => [1]])]);
        $this->assertSame([], app(Dashboard::class)->plan($id, 100, 1)['recipes_to_learn']);

        DB::table('gw2_account_state')->where('gw2_account_id', $id)->update(['unlocks' => null]);
        $this->assertNull(app(Dashboard::class)->plan($id, 100, 1)['recipes_to_learn'], 'unknown, not none');
    }

    public function test_a_forge_recipe_counts_only_once_checked_and_spends_the_wallet(): void
    {
        $this->items([[500, 'Legendary Thing'], [501, 'Gift of Something'], [503, 'Mystic Clover'], [504, 'Obsidian Shard']]);
        DB::table('gw2_reference')->insert(['kind' => 'currencies', 'ref_id' => 23, 'name' => 'Spirit Shard', 'payload' => json_encode(['id' => 23, 'name' => 'Spirit Shard'])]);

        $forge = DB::table('gw2_forge_recipes')->insertGetId([
            'output_item_id' => 500, 'output_count' => 1,
            'ingredients' => json_encode([['type' => 'Item', 'id' => 501, 'count' => 1], ['type' => 'Currency', 'id' => 23, 'count' => 100]]),
            'source_url' => 'https://example.test/recipes', 'source_label' => 'Test source', 'checked_at' => now(),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        // A clover comes out of about a third of attempts.
        DB::table('gw2_forge_recipes')->insert([
            'output_item_id' => 503, 'output_count' => 0.333,
            'ingredients' => json_encode([['type' => 'Item', 'id' => 504, 'count' => 1]]),
            'source_url' => 'https://example.test/recipes', 'checked_at' => now(),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $id = $this->account(state: ['wallet' => json_encode([['id' => 23, 'value' => 40]])]);

        $plan = app(Dashboard::class)->plan($id, 500, 1);

        $this->assertTrue($plan['craftable']);
        $this->assertNotNull($plan['tree']['forge']);
        $this->assertNull($plan['requires'], 'the forge has no discipline or rating to lack');

        $shards = collect($plan['shopping_list'])->firstWhere('currency_id', 23);
        $this->assertSame(40, $shards['owned'], 'drawn from the wallet');
        $this->assertSame(60, $shards['missing']);

        $clover = app(Dashboard::class)->plan($id, 503, 1)['tree'];
        $this->assertTrue($clover['forge']['random']);
        $this->assertSame(4, $clover['forge']['attempts'], 'ceil(1 / 0.333)');

        // A draft — no check date — is used nowhere.
        DB::table('gw2_forge_recipes')->where('id', $forge)->update(['checked_at' => null]);
        $this->assertFalse(app(Dashboard::class)->plan($id, 500, 1)['craftable']);
    }

    public function test_the_forge_dataset_loads_once_with_its_source_and_only_for_known_items(): void
    {
        $this->assertNull(app(ForgeDataset::class)->load(), 'no catalogue yet, nothing to check ids against');

        // The Mystic Clover recipe and its four ingredients; nothing else is known.
        $this->items([[19675, 'Mystic Clover'], [19925, 'Obsidian Shard'], [19976, 'Mystic Coin'], [19721, 'Glob of Ectoplasm'], [20796, "Philosopher's Stone"]]);
        $editor = DB::table('gw2_forge_recipes')->insertGetId([
            'output_item_id' => 19675, 'output_count' => 1, 'ingredients' => json_encode([]),
            'source_url' => 'https://example.test/editor', 'source_label' => 'An editor', 'checked_at' => now(),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $loaded = app(ForgeDataset::class)->load();

        $this->assertSame(1, $loaded['inserted']);
        $this->assertSame(2236, $loaded['skipped'], 'every recipe with an item the game does not list');

        $clover = DB::table('gw2_forge_recipes')->where('source_label', ForgeDataset::LABEL)->first();
        $this->assertSame(ForgeDataset::URL, $clover->source_url);
        $this->assertSame(0.31, (float) $clover->output_count, 'the yield as the source has it');
        $this->assertNull(app(ForgeDataset::class)->load(), 'this version is in already');

        // A newer version replaces the old one whole; the editor's row stays.
        DB::table('gw2_forge_recipes')->where('source_label', ForgeDataset::LABEL)->update(['source_url' => 'https://example.test/older']);
        $this->assertSame(1, app(ForgeDataset::class)->load()['replaced']);
        $this->assertTrue(DB::table('gw2_forge_recipes')->where('id', $editor)->exists());
    }

    public function test_the_forge_is_opened_only_for_what_cannot_be_bought(): void
    {
        DB::table('gw2_items')->insert([
            ['id' => 600, 'name' => 'Tribute', 'level' => 0, 'flags' => json_encode(['AccountBound'])],
            ['id' => 601, 'name' => 'Lodestone', 'level' => 0, 'flags' => json_encode([])],
            ['id' => 602, 'name' => 'Core', 'level' => 0, 'flags' => json_encode([])],
            ['id' => 603, 'name' => 'Clover', 'level' => 0, 'flags' => json_encode(['AccountBound'])],
            ['id' => 604, 'name' => 'Shard', 'level' => 0, 'flags' => json_encode([])],
        ]);
        $this->forge(600, 1, [[601, 5], [603, 2]]);
        $this->forge(601, 1, [[602, 2]]);
        $this->forge(603, 0.31, [[604, 1]]);

        $id = $this->account();
        $children = collect(app(Dashboard::class)->plan($id, 600, 1)['tree']['children'])->keyBy('item_id');

        $this->assertSame([], $children[601]['children'], 'sold on the trading post: a line to obtain, not a conversion ladder');
        $this->assertNull($children[601]['forge']);
        $this->assertNotEmpty($children[603]['children'], 'account bound: the forge is the only way in');

        // Asked for by name, it is opened like any target.
        $this->assertNotNull(app(Dashboard::class)->plan($id, 601, 1)['tree']['forge']);
    }

    public function test_of_several_forge_recipes_the_plan_takes_what_the_account_holds(): void
    {
        DB::table('gw2_items')->insert([
            ['id' => 700, 'name' => 'Facet', 'level' => 0, 'flags' => json_encode(['AccountBound'])],
            ['id' => 710, 'name' => 'Relic A', 'level' => 0, 'flags' => json_encode([])],
            ['id' => 711, 'name' => 'Relic B', 'level' => 0, 'flags' => json_encode([])],
            ['id' => 800, 'name' => 'Amalgam', 'level' => 0, 'flags' => json_encode([])],
            ['id' => 810, 'name' => 'Stone', 'level' => 0, 'flags' => json_encode([])],
        ]);
        $this->forge(700, 1, [[710, 1]]);
        $this->forge(700, 1, [[711, 1]]);
        // Twenty-five at once, or one at a time.
        $this->forge(800, 25, [[810, 250]]);
        $this->forge(800, 1, [[810, 10]]);

        $id = $this->account();
        DB::table('gw2_item_ledger')->insert(['gw2_account_id' => $id, 'item_id' => 711, 'quantity' => 1, 'location_type' => 'bank']);

        $facet = app(Dashboard::class)->plan($id, 700, 1)['tree'];
        $this->assertSame(711, $facet['children'][0]['item_id'], 'the relic already in the bank');
        $this->assertSame(1, $facet['forge']['other_recipes']);

        $amalgam = app(Dashboard::class)->plan($id, 800, 5)['tree'];
        $this->assertSame(50, $amalgam['children'][0]['needed'], 'five at ten stones each, not twenty-five at 250');
    }

    public function test_ownership_reads_access_and_says_what_came_with_it(): void
    {
        $owned = app(Ownership::class)->map(['GuildWars2', 'PlayForFree', 'PathOfFire']);

        $this->assertTrue($owned['heart_of_thorns'], 'Path of Fire counts for Heart of Thorns (gw2-api #86)');
        $this->assertTrue($owned['living_world_3'], 'included since 13 October 2026');
        $this->assertTrue($owned['living_world_2'], 'free');
        $this->assertFalse($owned['icebrood_saga'], 'comes with End of Dragons, which this account lacks');
        $this->assertNull($owned['visions_of_eternity'], 'the game does not report it — unknown, not "no"');

        $this->assertNull(app(Ownership::class)->map(null)['path_of_fire'], 'nobody signed in');
    }

    public function test_whats_new_narrows_to_what_you_own_since_you_left(): void
    {
        $this->assertCount(45, $this->getJson('/api/v1/gw2/public/changes')->assertOk()->json('data'));

        [$user] = $this->accountWithUser(access: ['GuildWars2', 'PathOfFire']);

        $this->actingAs($user)->putJson('/api/v1/gw2/returned', ['date' => '2026-01-01'])->assertOk();

        $changes = collect($this->actingAs($user)->getJson('/api/v1/gw2/whats-new')->assertOk()->json('data.changes'));

        $this->assertTrue($changes->every(fn ($c) => $c['date'] > '2026-01-01'));
        $this->assertFalse($changes->contains('applies_to', 'end_of_dragons'));
        // Kept, and marked: the game cannot say whether this account owns it.
        $this->assertNull($changes->firstWhere('applies_to', 'visions_of_eternity')['yours']);
    }

    public function test_an_insight_is_collected_when_its_id_is_unlocked_and_comes_with_its_nearest_waypoint(): void
    {
        DB::table('gw2_reference')->insert([
            'kind' => 'continent_maps', 'ref_id' => 1052, 'name' => 'Verdant Brink',
            'payload' => json_encode([
                'id' => 1052, 'name' => 'Verdant Brink', 'region' => 'Maguuma Jungle', 'min_level' => 80, 'max_level' => 80,
                'map_rect' => null, 'continent_rect' => [[0, 0], [1000, 1000]], 'floors' => [1],
                'mastery_points' => [['id' => 9, 'region' => 'Maguuma', 'coord' => [100, 100]], ['id' => 43, 'region' => 'Maguuma', 'coord' => [900, 900]]],
                'hero_challenges' => [['id' => '1-1', 'coord' => [5, 5]]],
                'waypoints' => [
                    ['id' => 1, 'name' => 'Jaka Itzel Waypoint', 'coord' => [120, 90], 'chat_link' => '[&BAAAAAA=]'],
                    ['id' => 2, 'name' => 'Faren\'s Flyer', 'coord' => [880, 950], 'chat_link' => '[&BBBBBBB=]'],
                ],
            ]),
        ]);

        [$user] = $this->accountWithUser(state: ['mastery_points' => json_encode(['totals' => [], 'unlocked' => [43, 500]])]);

        $map = $this->actingAs($user)->getJson('/api/v1/gw2/insights?map=1052')->assertOk()->json('data');

        $this->assertSame(1, $map['insights_collected']);
        $this->assertSame(1, $map['hero_challenges'], 'counted, never ticked');

        $left = collect($map['insights'])->firstWhere('id', 9);
        $this->assertFalse($left['collected']);
        $this->assertSame('Jaka Itzel Waypoint', $left['nearest_waypoint']['name']);

        // The public page is nobody's account.
        $this->assertNull($this->getJson('/api/v1/gw2/public/insights')->json('data.0.collected'));
    }

    public function test_the_catalogue_reads_the_season_and_boils_continents_down(): void
    {
        $this->app->instance(Gw2Client::class, new class extends Gw2Client
        {
            public function public(string $path, array $query = []): array
            {
                return match ($path) {
                    'wizardsvault' => ['title' => 'Code of Creation Season', 'end' => '2026-12-08T17:00:00Z', 'listings' => [1]],
                    'continents/1/floors' => [1, 2],
                    'continents/1/floors/1' => ['regions' => ['4' => ['name' => 'Maguuma Jungle', 'maps' => [
                        '1052' => ['id' => 1052, 'name' => 'Verdant Brink', 'mastery_points' => [['id' => 9, 'region' => 'Maguuma', 'coord' => [1, 1]]],
                            'points_of_interest' => ['7' => ['id' => 7, 'type' => 'waypoint', 'name' => 'Jaka Itzel Waypoint', 'coord' => [2, 2], 'chat_link' => '[&BAAAAAA=]']]],
                        // No insights, no challenges: not kept.
                        '15' => ['id' => 15, 'name' => 'Queensdale', 'points_of_interest' => []],
                    ]]]],
                    // The canopy floor holds a different insight of the same map.
                    'continents/1/floors/2' => ['regions' => ['4' => ['name' => 'Maguuma Jungle', 'maps' => [
                        '1052' => ['id' => 1052, 'name' => 'Verdant Brink', 'mastery_points' => [['id' => 10, 'region' => 'Maguuma', 'coord' => [3, 3]]]],
                    ]]]],
                    default => [],
                };
            }
        });

        $catalogue = app(CatalogueSync::class);

        $this->assertSame(1, $catalogue->refresh('wizardsvault', 1));
        $this->assertSame(1, $catalogue->refresh('continents', 1));

        $map = json_decode(DB::table('gw2_reference')->where('kind', 'continent_maps')->value('payload'), true);
        $this->assertSame([9, 10], array_column($map['mastery_points'], 'id'), 'both floors, merged');
        $this->assertSame([1, 2], $map['floors']);
        $this->assertSame('[&BAAAAAA=]', $map['waypoints'][0]['chat_link']);
    }

    public function test_an_account_read_keeps_the_trading_post_only_with_its_scope(): void
    {
        $api = new class extends Gw2Client
        {
            public function account(string $path, string $key, array $query = []): array
            {
                return match ($path) {
                    'account' => ['id' => 'ABC-123', 'name' => 'Garamel.6452', 'access' => ['GuildWars2']],
                    'commerce/delivery' => ['coins' => 12345, 'items' => [['id' => 19721, 'count' => 3]]],
                    'commerce/transactions/current/buys' => [['item_id' => 19721, 'price' => 10, 'quantity' => 2]],
                    'commerce/transactions/current/sells' => [['item_id' => 19721, 'price' => 30, 'quantity' => 1]],
                    'account/mapchests' => ['auric_basin_heros_choice_chest'],
                    'account/skins' => [1, 2, 3],
                    default => [],
                };
            }
        };
        $this->app->instance(Gw2Client::class, $api);

        $id = $this->account(scopes: ['account', 'progression', 'unlocks', 'tradingpost']);
        app(AccountSync::class)->full(ConnectedAccount::firstOrFail());

        $state = DB::table('gw2_account_state')->where('gw2_account_id', $id)->first();
        $this->assertSame(['auric_basin_heros_choice_chest'], json_decode($state->map_chests, true));
        $this->assertSame([1, 2, 3], json_decode($state->unlocks, true)['skins']);

        $tp = app(TradingPost::class)->for($id);
        $this->assertSame(12345, $tp['waiting']['coins']);
        $this->assertSame(20, $tp['in_buy_orders']);
        $this->assertSame(30, $tp['listed_for']);

        // Without the scope nothing is asked for, and nothing is claimed.
        ConnectedAccount::query()->update(['scopes' => json_encode(['account', 'progression'])]);
        DB::table('gw2_account_state')->where('gw2_account_id', $id)->update(['trading_post' => null]);
        app(AccountSync::class)->quick(ConnectedAccount::firstOrFail());
        $this->assertNull(app(TradingPost::class)->for($id));
    }

    public function test_connecting_keeps_a_limited_token_where_arenanet_issues_one(): void
    {
        $this->app->instance(Gw2Client::class, new class extends Gw2Client
        {
            public function tokenInfo(string $key): array
            {
                return ['id' => 'k', 'name' => 'TechPlay', 'permissions' => ['account', 'progression']];
            }

            public function account(string $path, string $key, array $query = []): array
            {
                return match ($path) {
                    'account' => ['id' => 'ABC-123', 'name' => 'Garamel.6452'],
                    'createsubtoken' => ['subtoken' => 'eyJhbGciOiJ.limited.token'],
                    default => [],
                };
            }
        });

        $connection = app(Gw2Connection::class)->connect(User::factory()->create(), 'C6BBD845-DD9F-C84D-80E3-A976646FDDE3-BBAE5D91-1248-4243-BAA3-E519923C5B19');

        $this->assertSame('eyJhbGciOiJ.limited.token', $connection->access_token, 'the key itself is not kept');
        $this->assertSame('subtoken', $connection->metadata['token_kind']);
        $this->assertTrue(Carbon::parse($connection->metadata['token_expires_at'])->between(now()->addDays(364), now()->addDays(366)));
    }

    public function test_a_world_boss_reaches_tonight_only_once_checked_and_says_if_it_is_done(): void
    {
        // Prefilled by the migration, unpublished and unchecked.
        $this->assertSame(15, DB::table('gw2_events')->where('kind', 'world_boss')->count());

        $id = $this->account(state: ['world_bosses' => json_encode(['tequatl_the_sunless'])]);
        $this->assertSame([], app(Dashboard::class)->tonight($id, null)['events']);

        DB::table('gw2_events')->whereIn('slug', ['tequatl_the_sunless', 'the_shatterer'])->update([
            'is_published' => true, 'verified_at' => now(), 'verified_source' => 'In game',
        ]);

        $events = collect(app(Dashboard::class)->tonight($id, null)['events']);

        $this->assertTrue($events->firstWhere('slug', 'tequatl_the_sunless')['killed_today']);
        $this->assertFalse($events->firstWhere('slug', 'the_shatterer')['killed_today']);
        $this->assertSame('the_shatterer', $events->first()['slug'], 'what is still to do comes first');
        $this->assertSame('[&BNABAAA=]', $events->firstWhere('slug', 'tequatl_the_sunless')['waypoint_chat_link']);
    }

    public function test_collections_price_the_cheapest_missing_piece_and_name_the_nearest_title(): void
    {
        $this->items([[700, 'Mini Llama'], [701, 'Mini Owned']]);
        DB::table('gw2_achievements')->insert(['id' => 1, 'name' => 'Llama Herder', 'requirement' => 'Herd.', 'advisor_eligible' => false]);
        DB::table('gw2_reference')->insert([
            ['kind' => 'minis', 'ref_id' => 1, 'name' => 'Mini Llama', 'payload' => json_encode(['id' => 1, 'name' => 'Mini Llama', 'item_id' => 700])],
            ['kind' => 'minis', 'ref_id' => 2, 'name' => 'Mini Owned', 'payload' => json_encode(['id' => 2, 'name' => 'Mini Owned', 'item_id' => 701])],
            ['kind' => 'titles', 'ref_id' => 5, 'name' => 'Herder', 'payload' => json_encode(['id' => 5, 'name' => 'Herder', 'achievements' => [1]])],
        ]);
        DB::table('gw2_item_prices')->insert([
            ['item_id' => 700, 'sell_unit' => 300, 'buy_unit' => 200, 'sell_quantity' => 5, 'buy_quantity' => 5, 'observed_at' => now()],
            ['item_id' => 701, 'sell_unit' => 100, 'buy_unit' => 90, 'sell_quantity' => 5, 'buy_quantity' => 5, 'observed_at' => now()],
        ]);

        $id = $this->account(state: [
            'unlocks' => json_encode(['skins' => [], 'minis' => [2], 'outfits' => [], 'titles' => []]),
            'achievements' => json_encode([['id' => 1, 'current' => 3, 'max' => 4, 'done' => false]]),
        ]);

        $collections = app(Collections::class)->for($id);

        $this->assertSame(['have' => 1, 'total' => 2], $collections['counts']['minis']);
        $this->assertSame([700], array_column($collections['cheapest']['minis'], 'item_id'), 'the owned one is not offered');
        $this->assertSame('Herder', $collections['closest_titles'][0]['title']);
        $this->assertSame('Llama Herder', $collections['closest_titles'][0]['achievement']);
    }

    public function test_the_armory_says_how_many_more_copies_are_useful(): void
    {
        $this->items([[800, 'Legendary Ring']]);
        DB::table('gw2_reference')->insert(['kind' => 'legendaryarmory', 'ref_id' => 800, 'name' => '800', 'payload' => json_encode(['id' => 800, 'max_count' => 2])]);

        $id = $this->account(state: ['unlocks' => json_encode(['legendary_armory' => [['id' => 800, 'count' => 1]]])]);

        $armory = app(LegendaryArmory::class)->for($id);

        $this->assertSame(1, $armory['owned'][0]['room']);
        $this->assertNull(app(LegendaryArmory::class)->for($this->account(state: ['unlocks' => null])), 'never read');
    }

    /* ── fixtures ─────────────────────────────────────────────────────── */

    /**
     * @param  array<string, mixed>  $state
     * @param  array<int, string>  $scopes
     * @param  array<int, string>  $access
     */
    private function account(array $state = [], array $scopes = ['account', 'progression', 'unlocks', 'wallet'], array $access = ['GuildWars2']): int
    {
        return $this->accountWithUser($state, $scopes, $access)[1];
    }

    /**
     * @param  array<string, mixed>  $state
     * @param  array<int, string>  $scopes
     * @param  array<int, string>  $access
     * @return array{0: User, 1: int}
     */
    private function accountWithUser(array $state = [], array $scopes = ['account', 'progression', 'unlocks', 'wallet'], array $access = ['GuildWars2']): array
    {
        $user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-'.$user->id,
            'display_name' => 'Garamel.6452', 'access_token' => 'k', 'scopes' => $scopes,
        ]);

        $id = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id, 'user_id' => $user->id, 'arena_account_id' => 'ABC-'.$user->id,
            'name' => 'Garamel.6452', 'access' => json_encode($access), 'created_at' => now(), 'updated_at' => now(),
        ]);

        // The test's own values win over the defaults.
        DB::table('gw2_account_state')->insert($state + ['gw2_account_id' => $id, 'observed_at' => now()]);

        return [$user, $id];
    }

    /** @param array<int, array{0: int, 1: string}> $items */
    private function items(array $items): void
    {
        foreach ($items as [$id, $name]) {
            DB::table('gw2_items')->insert(['id' => $id, 'name' => $name, 'level' => 80]);
        }
    }

    /** @param  array<int, array{0: int, 1: int}>  $ingredients */
    private function forge(int $output, float $count, array $ingredients): void
    {
        DB::table('gw2_forge_recipes')->insert([
            'output_item_id' => $output, 'output_count' => $count,
            'ingredients' => json_encode(array_map(fn ($i) => ['type' => 'Item', 'id' => $i[0], 'count' => $i[1]], $ingredients)),
            'source_url' => 'https://example.test/recipes', 'source_label' => 'Test source', 'checked_at' => now(),
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    /**
     * @param  array<int, array{0: int, 1: int}>  $ingredients
     * @param  array<int, string>  $flags
     */
    private function recipe(int $id, int $output, array $ingredients, array $flags = []): void
    {
        DB::table('gw2_recipes')->insert([
            'id' => $id,
            'output_item_id' => $output,
            'output_item_count' => 1,
            'ingredients' => json_encode(array_map(fn ($i) => ['item_id' => $i[0], 'count' => $i[1]], $ingredients)),
            'disciplines' => json_encode(['Armorsmith']),
            'min_rating' => 400,
            'flags' => json_encode($flags),
        ]);
    }
}
