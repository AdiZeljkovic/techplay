<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\Gw2Rule;
use App\Models\User;
use App\Services\Gw2\Advisor\Advisor;
use App\Services\Gw2\Advisor\Facts;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producers\GearGaps;
use App\Services\Gw2\Advisor\Producers\NearlyDoneAchievements;
use App\Services\Gw2\Advisor\Producers\UnspentMasteryPoints;
use App\Services\Gw2\Advisor\Producers\VaultObjectives;
use App\Services\Gw2\Advisor\SnapshotReader;
use Database\Seeders\Gw2RuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The advisor, against a fixture built from the real account.
 *
 * Every number below was read off a live Guild Wars 2 account on 28 September
 * 2026 rather than chosen to make a test pass: a worn set of 23 pieces of which
 * only 12 slots may count towards an ascended figure, two +10 agony infusions,
 * and an `access` field that omits Heart of Thorns while the same account holds
 * forty earned Heart of Thorns mastery points.
 *
 * That last one is the reason most of this file exists. It is the sort of thing
 * no amount of reading the code would have found.
 */
class Gw2AdvisorTest extends TestCase
{
    use RefreshDatabase;

    private int $accountId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedCatalogue();
        $this->accountId = $this->seedAccount();
    }

    public function test_an_expansion_the_account_has_played_counts_even_when_access_omits_it(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        // `access` on the fixture lists PathOfFire and not HeartOfThorns, exactly
        // as the live account answered. Forty earned Heart of Thorns mastery
        // points cannot be earned in content the account cannot enter.
        $this->assertTrue($snapshot->canReach('HeartOfThorns'));
        $this->assertTrue($snapshot->canReach('PathOfFire'));

        // Nothing invented in the other direction: a region with no points
        // earned stays out.
        $this->assertFalse($snapshot->canReach('EndOfDragons'));
    }

    public function test_agony_resistance_is_summed_from_the_worn_set_through_the_catalogue(): void
    {
        $character = app(SnapshotReader::class)->for($this->accountId)->primaryCharacter();

        // Two +10 infusions. The value comes from the item's
        // details.infix_upgrade, not from its name.
        $this->assertSame(20, $character->agonyResistance);
        $this->assertSame(130, $character->agonyShortfall());
    }

    public function test_gathering_tools_and_aquatic_gear_are_not_ascended_slots(): void
    {
        $character = app(SnapshotReader::class)->for($this->accountId)->primaryCharacter();

        // The worn set holds 23 pieces. Counting all of them would report a
        // character in full ascended armour as badly geared.
        $this->assertSame(12, $character->coreSlots);
        $this->assertSame(9, $character->ascendedSlots);
        $this->assertSame(['Ring2', 'Accessory1', 'Accessory2'], $character->slotsBelowAscended());

        // Land weapons only, counted apart because a build has no fixed number
        // of them.
        $this->assertSame(2, $character->ascendedWeapons);
        $this->assertSame(3, $character->weaponSlots);
    }

    public function test_a_fact_we_do_not_know_fails_every_condition(): void
    {
        $facts = ['vault.open_objectives' => null, 'mastery.unspent_total' => 35];

        // A key without the progression scope never read the vault. Treating
        // unknown as zero is how an account gets told it owns nothing.
        $this->assertFalse(Facts::satisfied([['path' => 'vault.open_objectives', 'op' => '>=', 'value' => 0]], $facts));
        $this->assertFalse(Facts::satisfied([['path' => 'nothing.here', 'op' => '>=', 'value' => 0]], $facts));
        $this->assertTrue(Facts::satisfied([['path' => 'mastery.unspent_total', 'op' => '>', 'value' => 30]], $facts));

        // An unknown operator is an editing mistake, and a mistake must not fire.
        $this->assertFalse(Facts::satisfied([['path' => 'mastery.unspent_total', 'op' => 'roughly', 'value' => 35]], $facts));
    }

    public function test_one_achievement_is_not_offered_twice_by_two_rules(): void
    {
        /*
         * One nearly-done achievement, not two.
         *
         * With two, the per-goal cap of two candidates happens to keep the
         * duplicate out on its own, and the test passes whether or not the
         * subject is deduplicated at all — which is how it was written the first
         * time. Narrowing the fixture to a single achievement leaves the subject
         * check as the only thing standing between the reader and the same
         * achievement under two headings.
         */
        DB::table('gw2_account_state')->where('gw2_account_id', $this->accountId)->update([
            'achievements' => json_encode([['id' => 1, 'current' => 16, 'max' => 17, 'done' => false]]),
        ]);

        $this->rule(['key' => 'one-step', 'producer' => NearlyDoneAchievements::KEY, 'domain' => 'achievements',
            'title' => 'Finish {name}', 'base_score' => 80,
            'requires' => [['path' => 'achievements.one_step_away', 'op' => '>', 'value' => 0]]]);

        $this->rule(['key' => 'nearly', 'producer' => NearlyDoneAchievements::KEY, 'domain' => 'achievements',
            'title' => 'Close on {name}', 'base_score' => 40,
            'requires' => [['path' => 'achievements.nearly_done', 'op' => '>', 'value' => 0]]]);

        $advice = $this->advise();
        $titles = array_column([...$advice['headline'], ...$advice['alternatives']], 'title');

        $this->assertSame(['Finish Auric Basin Explorer'], $titles);

        // Both rules did match. The cut is what removed the weaker one, not a
        // failure to produce it.
        $this->assertSame(2, $advice['considered']);
    }

    public function test_one_domain_cannot_own_every_slot(): void
    {
        /*
         * Six regions with points to spend, each of which is its own goal and so
         * survives the per-goal cap. That is the shape the live account had when
         * this went wrong: masteries and the vault filled the headline and all
         * three alternatives, and eight achievements one step from finishing
         * appeared nowhere at all.
         *
         * A fixture with three regions cannot reproduce it — there are then
         * fewer strong candidates than there are slots, and everything fits
         * whether or not the ranking spreads.
         */
        DB::table('gw2_account_state')->where('gw2_account_id', $this->accountId)->update([
            'mastery_points' => json_encode(['totals' => [
                ['region' => 'Central Tyria', 'earned' => 18, 'spent' => 11],
                ['region' => 'Heart of Thorns', 'earned' => 40, 'spent' => 24],
                ['region' => 'Path of Fire', 'earned' => 19, 'spent' => 8],
                ['region' => 'Icebrood Saga', 'earned' => 12, 'spent' => 2],
                ['region' => 'End of Dragons', 'earned' => 14, 'spent' => 3],
                ['region' => 'Janthir Wilds', 'earned' => 9, 'spent' => 1],
            ]]),
        ]);

        $this->rule(['key' => 'mastery', 'producer' => UnspentMasteryPoints::KEY, 'domain' => 'masteries',
            'title' => 'Spend {unspent} {region} points', 'base_score' => 95, 'confidence' => 'confirmed',
            'requires' => [['path' => 'mastery.unspent_total', 'op' => '>', 'value' => 0]]]);

        $this->rule(['key' => 'ach', 'producer' => NearlyDoneAchievements::KEY, 'domain' => 'achievements',
            'title' => 'Finish {name}', 'base_score' => 30,
            'requires' => [['path' => 'achievements.one_step_away', 'op' => '>', 'value' => 0]]]);

        $advice = $this->advise();
        $shown = [...$advice['headline'], ...$advice['alternatives']];
        $domains = array_column($shown, 'domain');

        $this->assertGreaterThan(6, $advice['considered'], 'The fixture must offer more candidates than there are slots.');
        $this->assertContains('achievements', $domains, 'A low-scoring domain must still be represented.');
        $this->assertSame('masteries', $domains[0], 'The strongest candidate still leads.');
    }

    public function test_a_time_budget_drops_what_does_not_fit(): void
    {
        $this->rule(['key' => 'quick-thing', 'producer' => VaultObjectives::KEY, 'domain' => 'vault',
            'title' => '{title}', 'effort_band' => 'quick',
            'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]]]);

        $this->rule(['key' => 'long-thing', 'producer' => GearGaps::KEY, 'domain' => 'gear',
            'title' => 'Upgrade the {slot}', 'effort_band' => 'long',
            'requires' => [['path' => 'character.ascended_missing', 'op' => '>', 'value' => 0]]]);

        $keys = array_column($this->advise(new Intent(minutes: 30))['headline'], 'key');

        $this->assertContains('quick-thing', $keys);
        $this->assertNotContains('long-thing', $keys);
    }

    public function test_an_expansion_gate_uses_what_the_account_can_reach_not_the_access_field(): void
    {
        $this->rule(['key' => 'hot-only', 'producer' => VaultObjectives::KEY, 'domain' => 'vault',
            'title' => '{title}', 'needs_expansion' => 'HeartOfThorns',
            'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]]]);

        $this->rule(['key' => 'eod-only', 'producer' => VaultObjectives::KEY, 'domain' => 'vault',
            'title' => 'EoD {title}', 'needs_expansion' => 'EndOfDragons',
            'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]]]);

        $keys = array_column($this->advise()['headline'], 'key');

        // Gating on the raw field would hide advice from a player who has forty
        // earned mastery points in that expansion.
        $this->assertContains('hot-only', $keys);
        $this->assertNotContains('eod-only', $keys);
    }

    public function test_a_rule_naming_a_producer_that_does_not_exist_says_nothing_and_does_not_crash(): void
    {
        $this->rule(['key' => 'typo', 'producer' => 'vault.open_objectiv', 'domain' => 'vault',
            'title' => 'oops', 'requires' => []]);

        $advice = $this->advise();

        $this->assertSame([], $advice['headline']);
        $this->assertSame(0, $advice['considered']);
    }

    public function test_a_retired_rule_keeps_its_row_and_stops_being_drawn(): void
    {
        $this->rule(['key' => 'retired', 'producer' => VaultObjectives::KEY, 'domain' => 'vault',
            'title' => '{title}', 'confidence' => 'hidden',
            'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]]]);

        $this->assertSame([], $this->advise()['headline']);
        $this->assertDatabaseHas('gw2_rules', ['key' => 'retired']);
    }

    /**
     * The game tells us which achievements are not nearly-complete candidates.
     *
     * `IgnoreNearlyComplete` is ArenaNet's own flag and it means exactly that.
     * 744 achievements carry it, and this engine recommended them for as long
     * as it existed. Curation catches them too, but a catalogue refresh adds
     * new achievements and a new one with this flag has to be excluded the
     * moment it arrives rather than when somebody gets round to reviewing it —
     * so the reader applies it directly, unreviewed rows included.
     */
    public function test_an_achievement_the_game_flags_as_ignorable_is_never_offered(): void
    {
        DB::table('gw2_achievements')->where('id', 2)->update([
            'flags' => json_encode(['Permanent', 'IgnoreNearlyComplete']),
        ]);

        $names = array_map(
            fn ($win) => $win->name,
            app(SnapshotReader::class)->for($this->accountId)->nearlyDone
        );

        $this->assertContains('Auric Basin Explorer', $names);
        $this->assertNotContains('Bava Nisos Explorer', $names);
    }

    /**
     * A re-seed corrects a default and leaves an edited rule alone.
     *
     * Both halves matter. `firstOrCreate` on its own froze the defaults at
     * whatever they were the day they first ran, so a threshold corrected in the
     * seeder never reached a database that already had the row — the same stale-
     * list failure the export and the deletion routine have each had. Updating
     * unconditionally would be worse: it would overwrite an editor mid-sentence.
     *
     * `reviewed_at` is how an editor says the row is theirs now.
     */
    public function test_reseeding_corrects_a_default_and_respects_an_editor(): void
    {
        $this->seed(Gw2RuleSeeder::class);

        $untouched = Gw2Rule::firstWhere('key', 'vault-unclaimed-acclaim');
        $untouched->update(['base_score' => 1]);

        $edited = Gw2Rule::firstWhere('key', 'vault-open-objective');
        $edited->update(['base_score' => 7, 'reviewed_at' => now()]);

        $this->seed(Gw2RuleSeeder::class);

        $this->assertSame(95, $untouched->fresh()->base_score, 'an unreviewed default should be corrected');
        $this->assertSame(7, $edited->fresh()->base_score, 'a reviewed rule belongs to whoever reviewed it');
    }

    /**
     * Picking a goal changes the answer.
     *
     * This is the test the feature existed without. `?goal=` was validated,
     * carried through Intent, and used by exactly one line — the cache bypass
     * check — while §8.2 makes goal relevance the largest single component of a
     * score at 0–35, ahead of blocker removal at 0–25. Half the product's
     * public promise, "Pick a goal", did nothing.
     */
    public function test_choosing_a_goal_lifts_the_rules_that_serve_it(): void
    {
        $this->rule([
            'key' => 'vault-thing', 'producer' => VaultObjectives::KEY, 'domain' => 'vault',
            'title' => '{title}', 'base_score' => 80, 'goals' => [],
            'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]],
        ]);

        $this->rule([
            'key' => 'gear-thing', 'producer' => GearGaps::KEY, 'domain' => 'gear',
            'title' => 'Upgrade the {slot}', 'base_score' => 50, 'goals' => ['first-ascended-set'],
            'requires' => [['path' => 'character.ascended_missing', 'op' => '>', 'value' => 0]],
        ]);

        // With nothing chosen, the higher base score leads.
        $this->assertSame('vault-thing', $this->advise()['headline'][0]['key']);

        // Choosing the goal the second rule serves puts it in front: 50 + 35
        // beats 80, which is the weighting §8.2 asks for. The bonus is large
        // enough to overturn a thirty-point gap and not large enough to
        // overturn any gap at all.
        $chosen = $this->advise(new Intent(goal: 'first-ascended-set'));
        $this->assertSame('gear-thing', $chosen['headline'][0]['key']);

        // And a goal nothing serves changes nothing rather than emptying the
        // board.
        $unserved = $this->advise(new Intent(goal: 'raid-entry'));
        $this->assertSame('vault-thing', $unserved['headline'][0]['key']);
    }

    /** @return array{headline: array<int, array<string, mixed>>, alternatives: array<int, array<string, mixed>>, considered: int} */
    private function advise(?Intent $intent = null): array
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        return app(Advisor::class)->advise($snapshot, $intent);
    }

    /** @param array<string, mixed> $attributes */
    private function rule(array $attributes): Gw2Rule
    {
        return Gw2Rule::create($attributes + [
            'body' => 'because.',
            'goals' => [],
            'base_score' => 50,
            'confidence' => 'medium',
            'is_active' => true,
        ]);
    }

    private function seedCatalogue(): void
    {
        $agony = json_encode(['infix_upgrade' => ['attributes' => [
            ['attribute' => 'AgonyResistance', 'modifier' => 10],
        ]]]);

        $items = [
            // The worn set, rarity for rarity as the live character wears it.
            [103889, 'Natural Visage', 'Armor', 'Ascended', null],
            [103979, 'Natural Shoulderguard', 'Armor', 'Ascended', null],
            [103800, 'Natural Guise', 'Armor', 'Ascended', null],
            [103801, 'Natural Grips', 'Armor', 'Ascended', null],
            [103802, 'Natural Leggings', 'Armor', 'Ascended', null],
            [103803, 'Natural Striders', 'Armor', 'Ascended', null],
            [103804, 'Defender\'s Xera Backpiece', 'Back', 'Ascended', null],
            [103805, 'Call of the Wild', 'Trinket', 'Ascended', null],
            [103806, 'Lunaria, Circle of the Moon', 'Trinket', 'Ascended', null],
            [80248, 'Natural Spire', 'Weapon', 'Ascended', null],
            [80249, 'Natural Revolver', 'Weapon', 'Ascended', null],
            [80250, 'Assassin\'s Destroyer Pistol', 'Weapon', 'Exotic', null],
            [80251, 'Charged Quartz Orichalcum Ring', 'Trinket', 'Exotic', null],
            [80252, 'Charged Quartz Orichalcum Earring', 'Trinket', 'Exotic', null],
            [80253, 'Charged Quartz Orichalcum Earring II', 'Trinket', 'Exotic', null],
            // The pieces that must not be counted.
            [80254, 'Fishing Rod', 'Gathering', 'Basic', null],
            [80255, 'Fairy Dust Mining Tool', 'Gathering', 'Rare', null],
            [80256, 'Metal Aquabreather', 'Armor', 'Masterwork', null],
            [80257, 'Celestial Bronze Spear of Force', 'Weapon', 'Exotic', null],
            [49433, '+10 Agony Infusion', 'UpgradeComponent', 'Ascended', $agony],
        ];

        foreach ($items as [$id, $name, $type, $rarity, $details]) {
            DB::table('gw2_items')->insert([
                'id' => $id, 'name' => $name, 'type' => $type,
                'rarity' => $rarity, 'level' => 80, 'details' => $details,
            ]);
        }

        DB::table('gw2_achievements')->insert([
            ['id' => 1, 'name' => 'Auric Basin Explorer', 'requirement' => 'Explore all areas in Auric Basin.', 'advisor_eligible' => false],
            ['id' => 2, 'name' => 'Bava Nisos Explorer', 'requirement' => 'Explore all areas.', 'advisor_eligible' => false],
        ]);
    }

    private function seedAccount(): int
    {
        $user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression', 'characters', 'inventories', 'unlocks', 'wallet'],
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'world' => 2003,
            'fractal_level' => 6,
            'daily_ap' => 140,
            // Exactly as the live account answered: Path of Fire, no Heart of Thorns.
            'access' => json_encode(['GuildWars2', 'PlayForFree', 'PathOfFire']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $equipment = [
            ['id' => 103889, 'slot' => 'Helm', 'infusions' => [49433]],
            ['id' => 103979, 'slot' => 'Shoulders', 'infusions' => [49433]],
            ['id' => 103800, 'slot' => 'Coat'],
            ['id' => 103801, 'slot' => 'Gloves'],
            ['id' => 103802, 'slot' => 'Leggings'],
            ['id' => 103803, 'slot' => 'Boots'],
            ['id' => 103804, 'slot' => 'Backpack'],
            ['id' => 103805, 'slot' => 'Amulet'],
            ['id' => 103806, 'slot' => 'Ring1'],
            ['id' => 80251, 'slot' => 'Ring2'],
            ['id' => 80252, 'slot' => 'Accessory1'],
            ['id' => 80253, 'slot' => 'Accessory2'],
            ['id' => 80248, 'slot' => 'WeaponA1'],
            ['id' => 80249, 'slot' => 'WeaponB1'],
            ['id' => 80250, 'slot' => 'WeaponB2'],
            ['id' => 80254, 'slot' => 'FishingRod'],
            ['id' => 80255, 'slot' => 'Pick'],
            ['id' => 80256, 'slot' => 'HelmAquatic'],
            ['id' => 80257, 'slot' => 'WeaponAquaticA'],
        ];

        DB::table('gw2_characters')->insert([
            'gw2_account_id' => $accountId,
            'name' => 'Isara Moonbloom',
            'profession' => 'Thief',
            'race' => 'Human',
            'level' => 80,
            'equipment' => json_encode($equipment),
            'specializations' => json_encode(['pve' => [], 'pvp' => [], 'wvw' => []]),
            'crafting' => json_encode([['discipline' => 'Tailor', 'rating' => 400, 'active' => true]]),
            'observed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $accountId,
            'achievements' => json_encode([
                ['id' => 1, 'current' => 16, 'max' => 17, 'done' => false],
                ['id' => 2, 'current' => 8, 'max' => 9, 'done' => false],
            ]),
            'mastery_points' => json_encode(['totals' => [
                ['region' => 'Central Tyria', 'earned' => 18, 'spent' => 11],
                ['region' => 'Heart of Thorns', 'earned' => 40, 'spent' => 24],
                ['region' => 'Path of Fire', 'earned' => 19, 'spent' => 8],
                ['region' => 'End of Dragons', 'earned' => 0, 'spent' => 0],
            ]]),
            'masteries' => json_encode([['id' => 1, 'level' => 1], ['id' => 17, 'level' => 0]]),
            'wizards_vault' => json_encode(['weekly' => [
                'meta_progress_current' => 6,
                'meta_progress_complete' => 6,
                'meta_reward_claimed' => true,
                'objectives' => [
                    ['id' => 50, 'title' => 'Complete the Loreclaw Expanse Jumping Puzzle', 'track' => 'PvE',
                        'acclaim' => 50, 'claimed' => false, 'progress_current' => 0, 'progress_complete' => 1],
                ],
            ]]),
            'observed_at' => now(),
        ]);

        return $accountId;
    }
}
