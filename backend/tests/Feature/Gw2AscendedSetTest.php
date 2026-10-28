<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\Advisor\Dashboard;
use App\Services\Gw2\Advisor\Producers\GearGaps;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The ascended set page — mockup 2.
 *
 * The fixture is the shape the owner's account had on 28 October 2026: a
 * character in medium armour, four pieces ascended with a chosen stat on the
 * worn copy, two still exotic, and every one of them Berserker's — under two
 * different itemstat ids, because the exotic and the crafted ascended piece do
 * not share one. A second character holds the discipline the first one lacks,
 * parked.
 */
class Gw2AscendedSetTest extends TestCase
{
    use RefreshDatabase;

    private int $accountId;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedCatalogue();
        $this->accountId = $this->seedAccount();
    }

    public function test_the_set_is_read_off_what_the_character_wears_and_planned_out_of_one_stock(): void
    {
        $set = app(Dashboard::class)->ascended($this->accountId);

        // Read, not chosen: the weight from the armour, the stats by name
        // across two ids.
        $this->assertSame('Medium', $set['weight']);
        $this->assertTrue($set['weight_known']);
        $this->assertSame("Berserker's", $set['stats']);
        $this->assertSame(4, $set['done']);

        $pieces = collect($set['pieces'])->keyBy('slot');
        $this->assertSame('done', $pieces['Helm']['state']);
        $this->assertSame('craft', $pieces['Leggings']['state']);
        $this->assertSame(3005, $pieces['Leggings']['target']['item_id']);
        $this->assertSame(3006, $pieces['Boots']['target']['item_id']);

        /*
         * One stock for the whole set. The bank holds one Elonian Leather
         * Square and each piece needs two: planned piece by piece, both would
         * find that one square and the set would need two spools. Spent once,
         * it needs three.
         */
        $gated = $set['time_gated'];
        $this->assertSame('Spool of Thick Elonian Cord', $gated['items'][0]['name']);
        $this->assertSame(3, $gated['items'][0]['missing']);
        $this->assertTrue($gated['items'][0]['crafted_today']);
        $this->assertSame(3, $gated['days']);

        // Nobody can craft it today, and the page names the alt who nearly can.
        $this->assertSame(['Leatherworker'], $set['crafting']['disciplines']);
        $this->assertSame(500, $set['crafting']['min_rating']);
        $this->assertFalse($set['crafting']['ready']);

        $path = collect($set['path'])->keyBy('key');
        $this->assertSame(['discipline', 'time_gated', 'buy', 'gather', 'craft'], $path->keys()->all());
        $this->assertStringContainsString('Varo is already at 500', $path['discipline']['body']);

        // Two insignia and nine scraps are bought; the leather is not sold at all.
        $this->assertSame(2 * 1500 + 9 * 30, $set['prices']['buy_now']);
        $this->assertSame('Hardened Leather Section', $set['prices']['not_tradable'][0]['name']);

        $materials = collect($set['materials'])->keyBy('item_id');
        $this->assertSame(2, $materials[4002]['needed']);
    }

    public function test_the_stats_are_the_players_to_change_and_only_crafted_pieces_of_the_right_weight_count(): void
    {
        $dashboard = app(Dashboard::class);

        // Heavy armour, a piece with a choice of stats, and a piece with no
        // recipe are all ascended Berserker's — and none of them is the set.
        $this->assertSame(["Berserker's", 'Celestial'], $dashboard->ascended($this->accountId)['stat_options']);

        $celestial = collect($dashboard->ascended($this->accountId, null, 'Celestial')['pieces'])->keyBy('slot');
        $this->assertSame(3106, $celestial['Boots']['target']['item_id']);

        // A prefix there is no crafted set in falls back to what is worn.
        $this->assertSame("Berserker's", $dashboard->ascended($this->accountId, null, 'Nonsense')['stats']);

        // And the weight asked for is ignored while there is armour to read it off.
        $this->assertSame('Medium', $dashboard->ascended($this->accountId, null, null, 'Heavy')['weight']);
    }

    public function test_a_piece_already_in_the_bank_is_equipped_not_crafted(): void
    {
        DB::table('gw2_item_ledger')->insert([
            'gw2_account_id' => $this->accountId, 'item_id' => 3006, 'quantity' => 1,
            'location_type' => 'bank', 'observed_at' => now(),
        ]);

        $set = app(Dashboard::class)->ascended($this->accountId);

        $this->assertSame('owned', collect($set['pieces'])->firstWhere('slot', 'Boots')['state']);
        $this->assertSame('equip', $set['path'][0]['key']);

        // Only the leggings are made now: two squares, one in the bank, one spool.
        $this->assertSame(1, $set['time_gated']['items'][0]['missing']);
        $this->assertFalse(collect($set['materials'])->contains('item_id', 3006));
    }

    public function test_the_progress_chart_counts_one_characters_pieces_by_game_week(): void
    {
        // A Wednesday. The game's week began on Monday at 07:30 UTC.
        $this->travelTo(now()->setDate(2026, 10, 28)->setTime(12, 0)->utc());

        DB::table('gw2_progress_events')->insert([
            ['gw2_account_id' => $this->accountId, 'type' => 'ascended_piece', 'occurred_at' => '2026-10-27 10:00:00',
                'payload' => json_encode(['id' => 2001, 'character' => 'Isara Moonbloom', 'slot' => 'Helm'])],
            ['gw2_account_id' => $this->accountId, 'type' => 'ascended_piece', 'occurred_at' => '2026-10-20 10:00:00',
                'payload' => json_encode(['id' => 2002, 'character' => 'Isara Moonbloom', 'slot' => 'Shoulders'])],
            // Somebody else's piece is not on this character's chart.
            ['gw2_account_id' => $this->accountId, 'type' => 'ascended_piece', 'occurred_at' => '2026-10-27 11:00:00',
                'payload' => json_encode(['id' => 2003, 'character' => 'Varo', 'slot' => 'Coat'])],
        ]);

        $progress = app(Dashboard::class)->ascended($this->accountId)['progress'];

        $this->assertSame(1, $progress['this_week']);
        $this->assertSame([0, 0, 0, 0, 1, 1], array_column($progress['weeks'], 'pieces'));
        $this->assertSame('Natural Visage', $progress['events'][0]['name']);

        // The account page's history names the piece too.
        $this->assertSame('Natural Visage', app(Dashboard::class)->history($this->accountId)['events'][1]['name']);
    }

    public function test_the_endpoint_answers_for_the_character_asked_about_and_refuses_a_stranger(): void
    {
        $this->actingAs($this->user)->getJson('/api/v1/gw2/ascended?character=Varo')
            ->assertOk()
            ->assertJsonPath('data.character.name', 'Varo')
            // No armour to read a weight off, so none is assumed.
            ->assertJsonPath('data.weight', null)
            ->assertJsonPath('data.weight_known', false);

        $this->actingAs($this->user)->getJson('/api/v1/gw2/ascended?character=Varo&weight=Medium')
            ->assertOk()
            ->assertJsonPath('data.weight', 'Medium');

        $this->actingAs($this->user)->getJson('/api/v1/gw2/ascended?character=Nobody')->assertNotFound();
        $this->actingAs($this->user)->getJson('/api/v1/gw2/ascended?weight=Plate')->assertUnprocessable();
    }

    public function test_an_armour_card_opens_the_set_and_a_trinket_card_does_not(): void
    {
        $this->assertSame('/gw2/ascended', GearGaps::action('Boots')['href']);

        // A ring is not something the set page can plan, and the guide is
        // not published here, so there is no button at all.
        $this->assertNull(GearGaps::action('Ring2'));
    }

    private function seedCatalogue(): void
    {
        $armour = fn (string $slot, string $weight, ?int $stat, bool $choices = false) => json_encode(array_filter([
            'type' => $slot,
            'weight_class' => $weight,
            'infix_upgrade' => $stat !== null ? ['id' => $stat, 'attributes' => []] : null,
            'stat_choices' => $choices ? [584, 588] : null,
        ]));

        $items = [
            // Worn: four ascended pieces with a chosen stat, two exotics.
            [2001, 'Natural Visage', 'Armor', 'Ascended', $armour('Helm', 'Medium', null, true)],
            [2002, 'Natural Shoulderguard', 'Armor', 'Ascended', $armour('Shoulders', 'Medium', null, true)],
            [2003, 'Natural Guise', 'Armor', 'Ascended', $armour('Coat', 'Medium', null, true)],
            [2004, 'Natural Grips', 'Armor', 'Ascended', $armour('Gloves', 'Medium', null, true)],
            [1005, "Berserker's Emblazoned Pants", 'Armor', 'Exotic', $armour('Leggings', 'Medium', 161)],
            [1006, "Berserker's Emblazoned Boots", 'Armor', 'Exotic', $armour('Boots', 'Medium', 161)],
            // Crafted, medium.
            [3005, "Zojja's Leggings", 'Armor', 'Ascended', $armour('Leggings', 'Medium', 584)],
            [3006, "Zojja's Boots", 'Armor', 'Ascended', $armour('Boots', 'Medium', 584)],
            [3105, "Ahamid's Leggings", 'Armor', 'Ascended', $armour('Leggings', 'Medium', 588)],
            [3106, "Ahamid's Boots", 'Armor', 'Ascended', $armour('Boots', 'Medium', 588)],
            // Ascended Berserker's that are not the set.
            [3206, "Zojja's Greaves", 'Armor', 'Ascended', $armour('Boots', 'Heavy', 584)],
            [3306, 'Exquisite Boots', 'Armor', 'Ascended', $armour('Boots', 'Medium', null, true)],
            [3406, 'Raid Boots', 'Armor', 'Ascended', $armour('Boots', 'Medium', 584)],
            // Materials.
            [4001, 'Elonian Leather Square', 'CraftingMaterial', 'Ascended', null],
            [4002, "Berserker's Intricate Leather Insignia", 'UpgradeComponent', 'Exotic', null],
            [4003, 'Spool of Thick Elonian Cord', 'CraftingMaterial', 'Ascended', null],
            [4004, 'Hardened Leather Section', 'CraftingMaterial', 'Basic', null],
            [4005, 'Silk Scrap', 'CraftingMaterial', 'Basic', null],
        ];

        foreach ($items as [$id, $name, $type, $rarity, $details]) {
            DB::table('gw2_items')->insert([
                'id' => $id, 'name' => $name, 'type' => $type,
                'rarity' => $rarity, 'level' => 80, 'details' => $details,
            ]);
        }

        $recipes = [
            [1, 3005, [[4001, 2], [4002, 1]], 500],
            [2, 3006, [[4001, 2], [4002, 1]], 500],
            [3, 3105, [[4001, 2], [4002, 1]], 500],
            [4, 3106, [[4001, 2], [4002, 1]], 500],
            [5, 3206, [[4001, 2], [4002, 1]], 500],
            [6, 3306, [[4001, 2], [4002, 1]], 500],
            [7, 4001, [[4003, 1], [4004, 2]], 450],
            [8, 4003, [[4005, 3]], 450],
        ];

        foreach ($recipes as [$id, $output, $ingredients, $rating]) {
            DB::table('gw2_recipes')->insert([
                'id' => $id, 'output_item_id' => $output, 'output_item_count' => 1,
                'ingredients' => json_encode(array_map(fn ($i) => ['item_id' => $i[0], 'count' => $i[1]], $ingredients)),
                'disciplines' => json_encode(['Leatherworker']), 'min_rating' => $rating,
                'flags' => json_encode([]),
            ]);
        }

        foreach ([[161, "Berserker's"], [584, "Berserker's"], [588, 'Celestial']] as [$id, $name]) {
            DB::table('gw2_reference')->insert([
                'kind' => 'itemstats', 'ref_id' => $id, 'name' => $name,
                'payload' => json_encode(['id' => $id, 'name' => $name]),
            ]);
        }

        DB::table('gw2_reference')->insert([
            'kind' => 'dailycrafting', 'ref_id' => crc32('spool_of_thick_elonian_cord'), 'name' => 'spool_of_thick_elonian_cord',
            'payload' => json_encode(['id' => 'spool_of_thick_elonian_cord']),
        ]);

        // The insignia sells; Hardened Leather Section has no price row at all.
        DB::table('gw2_item_prices')->insert([
            ['item_id' => 4002, 'buy_unit' => 1200, 'buy_quantity' => 10, 'sell_unit' => 1500, 'sell_quantity' => 10, 'observed_at' => now()],
            ['item_id' => 4005, 'buy_unit' => 20, 'buy_quantity' => 999, 'sell_unit' => 30, 'sell_quantity' => 999, 'observed_at' => now()],
        ]);
    }

    private function seedAccount(): int
    {
        $this->user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $this->user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression', 'characters', 'inventories', 'unlocks', 'wallet'],
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $this->user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'access' => json_encode(['GuildWars2']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $characters = [
            ['Isara Moonbloom', 'Thief', [
                ['id' => 2001, 'slot' => 'Helm', 'stats' => ['id' => 584]],
                ['id' => 2002, 'slot' => 'Shoulders', 'stats' => ['id' => 584]],
                ['id' => 2003, 'slot' => 'Coat', 'stats' => ['id' => 584]],
                ['id' => 2004, 'slot' => 'Gloves', 'stats' => ['id' => 584]],
                ['id' => 1005, 'slot' => 'Leggings'],
                ['id' => 1006, 'slot' => 'Boots'],
            ], [['discipline' => 'Leatherworker', 'rating' => 400, 'active' => true]]],
            ['Varo', 'Ranger', [], [['discipline' => 'Leatherworker', 'rating' => 500, 'active' => false]]],
        ];

        foreach ($characters as [$name, $profession, $equipment, $crafting]) {
            DB::table('gw2_characters')->insert([
                'gw2_account_id' => $accountId,
                'name' => $name,
                'profession' => $profession,
                'level' => 80,
                'equipment' => json_encode($equipment),
                'crafting' => json_encode($crafting),
                'observed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // One square in the bank — the stock the two pieces must share.
        DB::table('gw2_item_ledger')->insert([
            'gw2_account_id' => $accountId, 'item_id' => 4001, 'quantity' => 1,
            'location_type' => 'materials', 'observed_at' => now(),
        ]);

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $accountId,
            'daily_crafting' => json_encode(['spool_of_thick_elonian_cord']),
            'observed_at' => now(),
        ]);

        return $accountId;
    }
}
