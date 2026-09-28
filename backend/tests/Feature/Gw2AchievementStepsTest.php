<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\Gw2Guide;
use App\Models\Gw2Rule;
use App\Models\User;
use App\Services\Gw2\Advisor\GuidePersonalisation;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producers\NearlyDoneAchievements;
use App\Services\Gw2\Advisor\SnapshotReader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Naming the steps that are left, and §12.1.
 *
 * The step data is real: the `bits[].text` below is ArenaNet's wording copied
 * off the live `Skyscale Eggs` achievement, and `bits` on the account record is
 * the shape the account endpoint actually returns — a list of completed step
 * indices, not a count. The whole walkthrough is those two things joined on
 * position, so these tests are mostly about that join being right and staying
 * right.
 */
class Gw2AchievementStepsTest extends TestCase
{
    use RefreshDatabase;

    private int $accountId;

    public function test_the_remaining_steps_are_named_in_the_games_own_words(): void
    {
        $this->given([
            ['id' => 4666, 'current' => 8, 'max' => 10, 'bits' => [0, 1, 2, 3, 4, 5, 6, 8]],
        ], [
            [4666, 'Skyscale Eggs', null, [
                ['type' => 'Item', 'id' => 90760, 'text' => 'Gorrik could have picked this one up himself.'],
                ['type' => 'Item', 'id' => 90312, 'text' => 'Somewhere in Necrotic Coast.'],
                ['type' => 'Item', 'id' => 90375, 'text' => 'Somewhere in Ember Gate.'],
                ['type' => 'Item', 'id' => 90183, 'text' => 'Somewhere in Virulent Wastes.'],
                ['type' => 'Item', 'id' => 90853, 'text' => 'Somewhere in Crystal Bloom Camp.'],
                ['type' => 'Item', 'id' => 90317, 'text' => 'Somewhere in Scorched Cliffs.'],
                ['type' => 'Item', 'id' => 90784, 'text' => 'Somewhere in Umbral Battlegrounds.'],
                ['type' => 'Item', 'id' => 90386, 'text' => 'Somewhere in Dragon\'s Causeway.'],
                ['type' => 'Item', 'id' => 90239, 'text' => 'Somewhere in the Nascent Fount.'],
                ['type' => 'Item', 'id' => 90553, 'text' => 'Somewhere in Forging Steel.'],
            ]],
        ]);

        $win = app(SnapshotReader::class)->for($this->accountId)->nearlyDone[0];

        $this->assertTrue($win->stepsKnown());
        $this->assertCount(10, $win->steps);

        // Everything but 7 and 9 is ticked — and the index travels with the
        // step, because a client has to line the remaining ones up against the
        // full list to collapse the rest.
        $this->assertSame([7, 9], array_map(fn ($s) => $s->index, $win->remainingSteps()));
        $this->assertSame(
            ['Somewhere in Dragon\'s Causeway.', 'Somewhere in Forging Steel.'],
            array_map(fn ($s) => $s->text, $win->remainingSteps())
        );
    }

    public function test_a_step_with_no_wording_is_named_from_the_item_it_asks_for(): void
    {
        DB::table('gw2_items')->insert([
            'id' => 90853, 'name' => 'Spooky Egg', 'type' => 'Trophy', 'rarity' => 'Rare', 'level' => 0,
        ]);

        $this->given([
            ['id' => 4666, 'current' => 4, 'max' => 5, 'bits' => [0, 1, 2, 3]],
        ], [
            [4666, 'Skyscale Eggs', null, [
                ['type' => 'Item', 'id' => 90760, 'text' => 'Gorrik could have picked this one up himself.'],
                ['type' => 'Item', 'id' => 90312, 'text' => 'Somewhere in Necrotic Coast.'],
                ['type' => 'Item', 'id' => 90375, 'text' => 'Somewhere in Ember Gate.'],
                ['type' => 'Item', 'id' => 90183, 'text' => 'Somewhere in Virulent Wastes.'],
                // No text. The live catalogue has plenty of these.
                ['type' => 'Item', 'id' => 90853],
            ]],
        ]);

        $win = app(SnapshotReader::class)->for($this->accountId)->nearlyDone[0];

        $this->assertSame(['Spooky Egg'], array_map(fn ($s) => $s->text, $win->remainingSteps()));
    }

    public function test_a_step_we_cannot_name_stays_unnamed_rather_than_invented(): void
    {
        $this->given([
            ['id' => 4811, 'current' => 4, 'max' => 5, 'bits' => [0, 1, 2, 3]],
        ], [
            [4811, 'Mini Skyscale Hatchling Collection', null, [
                ['type' => 'Minipet', 'id' => 1, 'text' => 'Mini Skyscale Hatchling.'],
                ['type' => 'Minipet', 'id' => 2, 'text' => 'Mini Sleepy Skyscale.'],
                ['type' => 'Minipet', 'id' => 3, 'text' => 'Mini Curious Skyscale.'],
                ['type' => 'Minipet', 'id' => 4, 'text' => 'Mini Hungry Skyscale.'],
                // A mini we do not mirror, so there is no name anywhere.
                ['type' => 'Minipet', 'id' => 5],
            ]],
        ]);

        $win = app(SnapshotReader::class)->for($this->accountId)->nearlyDone[0];

        $this->assertCount(1, $win->remainingSteps());
        $this->assertNull($win->remainingSteps()[0]->text);
    }

    public function test_an_achievement_with_no_step_list_falls_back_to_its_requirement(): void
    {
        $this->given([
            ['id' => 2963, 'current' => 9, 'max' => 10, 'bits' => []],
        ], [
            [2963, 'Dungeon Frequenter', 'Complete 10 dungeon paths.', null],
        ]);

        $snapshot = app(SnapshotReader::class)->for($this->accountId);
        $win = $snapshot->nearlyDone[0];

        // No steps is not a failure to read steps. A counter has none.
        $this->assertFalse($win->stepsKnown());
        $this->assertSame([], $win->remainingSteps());

        $signal = app(NearlyDoneAchievements::class)
            ->produce($this->rule(), $snapshot, new Intent(goal: null))[0];

        $this->assertSame('Complete 10 dungeon paths.', $signal->facts['next_step']);

        // Nothing structured to send, so the key is absent rather than empty.
        $this->assertArrayNotHasKey('details', $signal->toArray());
    }

    public function test_the_steps_that_are_left_reach_the_payload(): void
    {
        $this->given([
            ['id' => 4666, 'current' => 8, 'max' => 10, 'bits' => [0, 1, 2, 3, 4, 5, 6, 8]],
        ], [
            [4666, 'Skyscale Eggs', null, [
                ['type' => 'Item', 'id' => 90760, 'text' => 'Gorrik could have picked this one up himself.'],
                ['type' => 'Item', 'id' => 90312, 'text' => 'Somewhere in Necrotic Coast.'],
                ['type' => 'Item', 'id' => 90375, 'text' => 'Somewhere in Ember Gate.'],
                ['type' => 'Item', 'id' => 90183, 'text' => 'Somewhere in Virulent Wastes.'],
                ['type' => 'Item', 'id' => 90853, 'text' => 'Somewhere in Crystal Bloom Camp.'],
                ['type' => 'Item', 'id' => 90317, 'text' => 'Somewhere in Scorched Cliffs.'],
                ['type' => 'Item', 'id' => 90784, 'text' => 'Somewhere in Umbral Battlegrounds.'],
                ['type' => 'Item', 'id' => 90386, 'text' => 'Somewhere in Dragon\'s Causeway.'],
                ['type' => 'Item', 'id' => 90239, 'text' => 'Somewhere in the Nascent Fount.'],
                ['type' => 'Item', 'id' => 90553, 'text' => 'Somewhere in Forging Steel.'],
            ]],
        ]);

        $payload = app(NearlyDoneAchievements::class)->produce(
            $this->rule(),
            app(SnapshotReader::class)->for($this->accountId),
            new Intent(goal: null),
        )[0]->toArray();

        $this->assertSame(10, $payload['details']['steps_total']);
        $this->assertSame(
            ['Somewhere in Dragon\'s Causeway.', 'Somewhere in Forging Steel.'],
            array_column($payload['details']['steps_remaining'], 'text')
        );

        // The sentence names the first thing left rather than the achievement's
        // blanket requirement, which is the whole point of storing `bits`.
        $this->assertSame(
            '8 of 10 done, so 2 to go. Next: Somewhere in Dragon\'s Causeway.',
            $payload['body']
        );
    }

    public function test_a_mastery_point_in_a_region_that_is_short_is_lifted_past_closer_ones(): void
    {
        $this->seedMasteryShortfall();

        /*
         * §12.1: *"Boost achievements that award a Mastery Point needed by the
         * user's currently selected region/goal."*
         *
         * Achievement 99 is the furthest from done of the eight and would be
         * cut — the producer shows six. It pays a Path of Fire point into a
         * region whose cheapest untrained tier costs more than the account has
         * unspent, so it comes first instead.
         */
        $this->assertSame('achievement:99', $this->subjects()[0]);

        // Proven by breaking: with the reward removed it is the one that falls
        // off the end, which is where it sat before any of this existed.
        DB::table('gw2_achievements')->where('id', 99)->update(['mastery_region' => null]);

        $this->assertNotContains('achievement:99', $this->subjects());
    }

    public function test_a_region_that_already_has_the_points_is_not_boosted(): void
    {
        $this->seedMasteryShortfall();

        /*
         * The reading of "needed" that matters. An account sitting on more
         * unspent points than the next tier costs does not need another one —
         * handing it a mastery-point achievement would be advice that changes
         * nothing, which is the failure this whole tool exists to avoid.
         */
        DB::table('gw2_account_state')->where('gw2_account_id', $this->accountId)->update([
            'mastery_points' => json_encode(['totals' => [
                ['region' => 'Path of Fire', 'earned' => 40, 'spent' => 8],
            ]]),
        ]);

        $this->assertNotContains('achievement:99', $this->subjects());
    }

    public function test_the_mastery_note_appears_only_where_it_applies(): void
    {
        $this->seedMasteryShortfall();

        $signals = app(NearlyDoneAchievements::class)->produce(
            $this->rule(),
            app(SnapshotReader::class)->for($this->accountId),
            new Intent(goal: null),
        );

        $this->assertStringContainsString('Path of Fire mastery point', $signals[0]->body());

        // And the sentence closes cleanly for everything else, rather than
        // trailing the double space an empty fact leaves behind.
        $this->assertSame('9 of 10 done, so 1 to go. Explore it.', $signals[1]->body());
    }

    public function test_a_guide_shows_its_curated_chain_in_its_curated_order(): void
    {
        $this->given([
            ['id' => 4666, 'current' => 2, 'max' => 2, 'done' => true, 'bits' => [0, 1]],
            ['id' => 4668, 'current' => 1, 'max' => 2, 'bits' => [0]],
        ], [
            [4666, 'Skyscale Eggs', null, [['type' => 'Item', 'id' => 1, 'text' => 'One.'], ['type' => 'Item', 'id' => 2, 'text' => 'Two.']]],
            [4668, 'Skyscale Flight', null, [['type' => 'Item', 'id' => 3, 'text' => 'Three.'], ['type' => 'Item', 'id' => 4, 'text' => 'Four.']]],
            // In the chain but untouched, so the account has no record of it.
            [4712, 'Saving Skyscales', null, [['type' => 'Item', 'id' => 5, 'text' => 'Five.']]],
        ]);

        Gw2Guide::create([
            'family' => 'mounts', 'slug' => 'skyscale', 'title' => 'Skyscale',
            'personalise_as' => 'guide:mounts/skyscale', 'is_published' => true,
            'achievement_ids' => [4666, 4668, 4712],
        ]);

        $block = app(GuidePersonalisation::class)->for('guide:mounts/skyscale', $this->accountId);

        $this->assertSame('collection', $block['kind']);
        $this->assertSame(1, $block['complete']);
        $this->assertSame(3, $block['total']);

        // The curated order, not the catalogue's and not sorted by progress.
        // That order is the part a person contributed.
        $this->assertSame(
            ['Skyscale Eggs', 'Skyscale Flight', 'Saving Skyscales'],
            array_column($block['items'], 'name')
        );

        // A finished collection lists nothing left, whatever its bits say.
        $this->assertSame([], $block['items'][0]['steps_remaining']);
        $this->assertSame(['Four.'], array_column($block['items'][1]['steps_remaining'], 'text'));

        /*
         * The untouched one is the case worth guarding. `current` is null and
         * not zero, because an achievement can be absent from the account
         * record for two different reasons — not started, or not yet unlocked
         * — and a zero would flatten those into a claim we cannot make.
         */
        $this->assertNull($block['items'][2]['current']);
        $this->assertSame(['Five.'], array_column($block['items'][2]['steps_remaining'], 'text'));
    }

    public function test_a_guide_with_no_curated_list_personalises_nothing(): void
    {
        $this->given([], []);

        Gw2Guide::create([
            'family' => 'mounts', 'slug' => 'raptor', 'title' => 'Raptor',
            'personalise_as' => 'guide:mounts/raptor', 'is_published' => true,
        ]);

        // A page nobody has listed the achievements for reads exactly as it
        // does for a stranger, which is what it was written to do.
        $this->assertNull(app(GuidePersonalisation::class)->for('guide:mounts/raptor', $this->accountId));
        $this->assertNull(app(GuidePersonalisation::class)->for('guide:mounts/nothing-here', $this->accountId));
    }

    /**
     * Eight candidates, the mastery one furthest from done.
     *
     * Path of Fire has one unfinished track whose next tier costs 12 and the
     * account holds 11 unspent — one short, which is exactly the state where a
     * mastery point is the thing in the way.
     */
    private function seedMasteryShortfall(): void
    {
        $state = [];
        $catalogue = [];

        // Seven at one step from done, so the boosted one cannot win on
        // closeness and the cut is genuinely doing something.
        foreach (range(1, 7) as $i) {
            $state[] = ['id' => $i, 'current' => 9, 'max' => 10, 'bits' => []];
            $catalogue[] = [$i, "Explorer {$i}", 'Explore it.', null];
        }

        $state[] = ['id' => 99, 'current' => 8, 'max' => 10, 'bits' => []];
        $catalogue[] = [99, 'Elon Riverlands Insight', 'Find the insight.', null, 'Desert'];

        $this->given($state, $catalogue, [
            'totals' => [['region' => 'Path of Fire', 'earned' => 19, 'spent' => 8]],
        ]);

        DB::table('gw2_masteries')->insert([
            'id' => 20, 'name' => 'Raptor', 'region' => 'Desert', 'order' => 1,
            'levels' => json_encode([
                ['name' => 'Raptor Rider', 'point_cost' => 1],
                ['name' => 'Canyon Jumping', 'point_cost' => 12],
            ]),
        ]);

        // Tier one paid, tier two not: `level` is a zero-based index of the
        // highest completed tier. See MasteryRegions.
        DB::table('gw2_account_state')->where('gw2_account_id', $this->accountId)
            ->update(['masteries' => json_encode([['id' => 20, 'level' => 0]])]);
    }

    /** @return array<int, string> */
    private function subjects(): array
    {
        return array_map(
            fn ($s) => $s->subject,
            app(NearlyDoneAchievements::class)->produce(
                $this->rule(),
                app(SnapshotReader::class)->for($this->accountId),
                new Intent(goal: null),
            )
        );
    }

    private function rule(): Gw2Rule
    {
        return Gw2Rule::firstOrCreate(['key' => 'achievement-nearly-done'], [
            'producer' => NearlyDoneAchievements::KEY,
            'domain' => 'achievements',
            'title' => 'Close on {name}',
            'body' => '{current} of {max} done, so {remaining} to go. {next_step}{mastery_note}',
            'base_score' => 50,
            'confidence' => 'medium',
            'is_active' => true,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $achievements  The account's own record.
     * @param  array<int, array<int, mixed>>  $catalogue  [id, name, requirement, bits, masteryRegion?]
     * @param  array<string, mixed>|null  $masteryPoints
     */
    private function given(array $achievements, array $catalogue, ?array $masteryPoints = null): void
    {
        $user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression', 'unlocks'],
        ]);

        $this->accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'access' => json_encode(['GuildWars2', 'PathOfFire']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($catalogue as $row) {
            [$id, $name, $requirement, $bits] = $row;

            DB::table('gw2_achievements')->insert([
                'id' => $id,
                'name' => $name,
                'requirement' => $requirement,
                'bits' => $bits === null ? null : json_encode($bits),
                'mastery_region' => $row[4] ?? null,
                // Reviewed, so the "not yet checked by us" blocker stays out of
                // the way of what these tests are actually about.
                'reviewed_at' => now(),
                'advisor_eligible' => true,
            ]);
        }

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $this->accountId,
            'achievements' => json_encode($achievements),
            'mastery_points' => $masteryPoints === null ? null : json_encode($masteryPoints),
            'observed_at' => now(),
        ]);
    }
}
