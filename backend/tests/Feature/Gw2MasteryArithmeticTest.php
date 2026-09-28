<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\Advisor\MasteryRegions;
use App\Services\Gw2\Advisor\SnapshotReader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Mastery points have to add up, or the progress bars are fiction.
 *
 * Two things about this API are undocumented and were settled by arithmetic
 * rather than by reading anything, and both are silent when wrong — a renamed
 * region or a changed `level` meaning would halve somebody's progress without
 * raising an error anywhere.
 *
 * **`/v2/masteries` and `/v2/account/mastery/points` use different names for the
 * same region.** The catalogue says `Maguuma`; the account says `Heart of
 * Thorns`. Nothing in either response connects them.
 *
 * **`level` counts from zero.** Reading it as the number of completed tiers gave
 * 10, 6, 3 and 0 spent points against four regions the live account reported as
 * 24, 11, 8 and 1. Reading it as a zero-based index — so `level + 1` tiers are
 * paid for — gives 24, 11, 8 and 1. Four independent totals, all exact.
 *
 * The fixture below is that account, so this test is that reconciliation.
 */
class Gw2MasteryArithmeticTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Tracks and tier costs copied from the catalogue on 28 September 2026.
     *
     * @var array<int, array{0: string, 1: string, 2: list<int>}>
     */
    private const TRACKS = [
        1 => ['Exalted Lore', 'Maguuma', [1, 2, 3, 5, 8]],
        2 => ['Itzel Lore', 'Maguuma', [1, 2, 3, 5, 8, 12]],
        3 => ['Nuhoch Lore', 'Maguuma', [1, 2, 3, 5, 8, 12]],
        4 => ['Pact Commander', 'Tyria', [1, 2, 3, 5, 8]],
        8 => ['Gliding', 'Maguuma', [1, 2, 3, 5, 8, 12]],
        13 => ['Ancient Magics', 'Maguuma', [1, 3, 3, 3, 7, 7]],
        14 => ['Raptor Mount', 'Desert', [1, 2, 3, 4]],
        17 => ['Springer Mount', 'Desert', [2, 3, 4, 5]],
        23 => ['Raven Attunement', 'Tundra', [1, 1, 2, 2]],
        // A track in a region the account has no points in, so the reader cannot
        // quietly rely on every catalogue row having an account counterpart.
        29 => ['Skiff Piloting', 'Jade', [1, 2, 3, 5]],
        // And one whose region this project deliberately does not map.
        40 => ['Rift Amplification', 'Magic', [1, 2, 3]],
    ];

    /** What the live account reported: track id => the API's `level`. */
    private const ACCOUNT_LEVELS = [
        1 => 1, 2 => 1, 3 => 1, 4 => 3, 8 => 3, 13 => 1, 14 => 2, 17 => 0, 23 => 0,
    ];

    /** And what it reported as spent, per region, in its own vocabulary. */
    private const REPORTED_SPENT = [
        'Heart of Thorns' => 24,
        'Central Tyria' => 11,
        'Path of Fire' => 8,
        'Icebrood Saga' => 1,
    ];

    private int $accountId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->accountId = $this->seedAccount();
    }

    public function test_what_we_compute_as_spent_matches_what_the_account_reports(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        foreach (self::REPORTED_SPENT as $region => $reported) {
            $this->assertSame(
                $reported,
                $snapshot->pointsSpentIn($region),
                "Mastery points spent in {$region} do not reconcile. Either the region names "
                .'no longer pair up, or `level` no longer counts from zero.'
            );
        }
    }

    public function test_a_level_of_zero_means_one_tier_is_paid_for(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        $springer = collect($snapshot->masteryTracks)->firstWhere('id', 17);

        // The API reported level 0 for this track. That is one tier paid, at a
        // cost of 2 — not zero tiers and nothing spent.
        $this->assertSame(1, $springer->tiersPaid);
        $this->assertSame(2, $springer->pointsSpent());
        $this->assertSame(3, $springer->nextTierCost());
    }

    public function test_a_track_the_account_has_never_touched_is_absent_not_zeroed(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        // Skiff Piloting is not in the account's response at all, which means
        // nothing is paid for — the opposite of a level of 0.
        $skiff = collect($snapshot->masteryTracks)->firstWhere('id', 29);

        $this->assertSame(0, $skiff->tiersPaid);
        $this->assertTrue($skiff->untouched());
        $this->assertSame(1, $skiff->nextTierCost());
    }

    public function test_an_unmapped_catalogue_region_is_left_out_rather_than_guessed(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        $rift = collect($snapshot->masteryTracks)->firstWhere('id', 40);

        // Its tracks are still read and still available to show on their own.
        $this->assertSame('Magic', $rift->catalogueRegion);

        // But it is deliberately not paired with an account region: guessing one
        // would file the points under the wrong expansion.
        $this->assertNull($rift->region);
        $this->assertNull(MasteryRegions::toAccountName('Magic'));
    }

    public function test_the_advisor_only_offers_a_tier_the_points_can_pay_for(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        // 40 earned, 24 spent — 16 to spend, all of it locked to this region.
        $affordable = $snapshot->affordableIn('Heart of Thorns');

        $this->assertNotEmpty($affordable);

        foreach ($affordable as $track) {
            $this->assertLessThanOrEqual(16, $track->nextTierCost());
            $this->assertFalse($track->finished());
        }

        /*
         * Cheapest first, so the top recommendation leaves the most over.
         *
         * Three, not two, and the difference is the point of doing this per tier
         * at all: four of the five Heart of Thorns tracks sit two tiers in, where
         * the ladder has already climbed to 3. Nothing in this region costs less
         * than that, however many spare points the account is holding.
         */
        $this->assertSame(3, $affordable[0]->nextTierCost());

        // Icebrood Saga has one point spare and Raven Attunement's next tier
        // costs one, so it is affordable; nothing more expensive may appear.
        foreach ($snapshot->affordableIn('Icebrood Saga') as $track) {
            $this->assertLessThanOrEqual(1, $track->nextTierCost());
        }
    }

    public function test_a_region_the_account_has_never_entered_affords_nothing(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);

        // Not an error and not an empty region — simply no budget. The points
        // endpoint omits regions the account has not entered, so this path is
        // reached in normal use.
        $this->assertSame([], $snapshot->affordableIn('End of Dragons'));
        $this->assertSame([], $snapshot->affordableIn('Nowhere At All'));
    }

    private function seedAccount(): int
    {
        foreach (self::TRACKS as $id => [$name, $region, $costs]) {
            DB::table('gw2_masteries')->insert([
                'id' => $id,
                'name' => $name,
                'region' => $region,
                'order' => $id,
                'levels' => json_encode(array_map(
                    fn ($cost, $i) => ['name' => "Tier {$i}", 'point_cost' => $cost],
                    $costs,
                    array_keys($costs)
                )),
            ]);
        }

        $user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression'],
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'access' => json_encode(['GuildWars2', 'PathOfFire']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $accountId,
            'masteries' => json_encode(array_map(
                fn ($id, $level) => ['id' => $id, 'level' => $level],
                array_keys(self::ACCOUNT_LEVELS),
                self::ACCOUNT_LEVELS
            )),
            'mastery_points' => json_encode(['totals' => [
                ['region' => 'Central Tyria', 'earned' => 18, 'spent' => 11],
                ['region' => 'Heart of Thorns', 'earned' => 40, 'spent' => 24],
                ['region' => 'Path of Fire', 'earned' => 19, 'spent' => 8],
                ['region' => 'Icebrood Saga', 'earned' => 2, 'spent' => 1],
                ['region' => 'End of Dragons', 'earned' => 0, 'spent' => 0],
            ]]),
            'observed_at' => now(),
        ]);

        return $accountId;
    }
}
