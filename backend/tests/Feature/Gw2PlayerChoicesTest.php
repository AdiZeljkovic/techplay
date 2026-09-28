<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\Advisor\PlayerChoices;
use App\Services\Gw2\Advisor\SnapshotReader;
use Database\Seeders\Gw2GoalSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The three things the player knows and the account does not.
 *
 * A pin outlives the tab (§21), a chosen character overrides our ranking
 * (§26.2), and a confirmation answers what the API cannot (§17.3). All three
 * exist because the working document says reading ArenaNet is not enough, and
 * all three have to stay distinguishable from something the game told us.
 */
class Gw2PlayerChoicesTest extends TestCase
{
    use RefreshDatabase;

    private int $accountId;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(Gw2GoalSeeder::class);
        $this->accountId = $this->seedAccount();
    }

    public function test_a_pin_outlives_the_request_and_becomes_the_default_goal(): void
    {
        $choices = app(PlayerChoices::class);

        $this->assertNull($choices->defaultGoal($this->accountId));

        $this->actingAs($this->user)
            ->postJson('/api/v1/gw2/pins', ['goal' => 'fractals'])
            ->assertOk();

        // The point of pinning: somebody who said last week that they are
        // working towards fractals should not have to say it again today.
        $this->assertSame('fractals', $choices->defaultGoal($this->accountId));
    }

    public function test_the_newest_pin_leads(): void
    {
        $choices = app(PlayerChoices::class);

        $choices->pin($this->accountId, 'fractals');
        $choices->pin($this->accountId, 'masteries');

        // Pinning a second goal usually means the emphasis moved, not that the
        // older one should keep the top slot.
        $this->assertSame('masteries', $choices->defaultGoal($this->accountId));
        $this->assertCount(2, $choices->pins($this->accountId));
    }

    public function test_pinning_the_same_goal_twice_raises_it_rather_than_failing(): void
    {
        $choices = app(PlayerChoices::class);

        $choices->pin($this->accountId, 'fractals');
        $choices->pin($this->accountId, 'masteries');
        $choices->pin($this->accountId, 'fractals');

        $this->assertCount(2, $choices->pins($this->accountId));
        $this->assertSame('fractals', $choices->defaultGoal($this->accountId));
    }

    public function test_a_goal_nobody_offers_is_refused(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/gw2/pins', ['goal' => 'become-a-dragon'])
            ->assertNotFound();
    }

    public function test_the_chosen_character_beats_our_ranking(): void
    {
        // Our ranking would pick the level 80 with better gear.
        $this->assertSame('Isara Moonbloom', app(SnapshotReader::class)->for($this->accountId)->primaryCharacter()->name);

        $this->actingAs($this->user)
            ->putJson('/api/v1/gw2/character', ['character' => 'Little Alt'])
            ->assertOk();

        $this->assertSame('Little Alt', app(SnapshotReader::class)->for($this->accountId)->primaryCharacter()->name);

        // And clearing it hands the choice back, which somebody has to be able
        // to do.
        $this->actingAs($this->user)->putJson('/api/v1/gw2/character', ['character' => null])->assertOk();
        $this->assertSame('Isara Moonbloom', app(SnapshotReader::class)->for($this->accountId)->primaryCharacter()->name);
    }

    public function test_a_character_on_somebody_elses_account_is_refused(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/v1/gw2/character', ['character' => 'Not Mine'])
            ->assertStatus(422);
    }

    public function test_unsure_is_a_real_answer_and_is_kept(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/gw2/confirm', [
                'subject' => 'elite_spec:Isara Moonbloom',
                'answer' => 'unsure',
            ])
            ->assertOk();

        $stored = app(PlayerChoices::class)->confirmations($this->accountId);

        // Storing "unsure" is what stops the question being asked again next
        // week — the difference between a tool that listens and one that nags.
        $this->assertSame('unsure', $stored['elite_spec:Isara Moonbloom']['answer']);

        // And it is recorded as the player's claim, never as something the API
        // said.
        $this->assertSame('player', $stored['elite_spec:Isara Moonbloom']['source']);
    }

    public function test_the_open_question_is_the_one_the_api_documents_as_unanswerable(): void
    {
        $snapshot = app(SnapshotReader::class)->for($this->accountId);
        $questions = app(PlayerChoices::class)->openQuestions($snapshot);

        // Only the level 80. Asking about a level 12 would be noise.
        $this->assertCount(1, $questions);
        $this->assertSame('elite_spec:Isara Moonbloom', $questions[0]['subject']);
        $this->assertNull($questions[0]['answer']);

        app(PlayerChoices::class)->confirm($this->accountId, 'elite_spec:Isara Moonbloom', 'yes');

        $answered = app(PlayerChoices::class)->openQuestions($snapshot);
        $this->assertSame('yes', $answered[0]['answer']);
    }

    public function test_the_dashboard_falls_back_to_the_pin(): void
    {
        app(PlayerChoices::class)->pin($this->accountId, 'fractals');

        $response = $this->actingAs($this->user)->getJson('/api/v1/gw2/dashboard')->assertOk();

        $this->assertSame('fractals', $response->json('data.goal_in_use'));
        $this->assertSame('fractals', $response->json('data.pins.0.slug'));
    }

    private function seedAccount(): int
    {
        $this->user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $this->user->id, 'provider' => 'gw2', 'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452', 'access_token' => 'k',
            'scopes' => ['account', 'progression', 'characters'],
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $this->user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ([['Isara Moonbloom', 80], ['Little Alt', 12]] as [$name, $level]) {
            DB::table('gw2_characters')->insert([
                'gw2_account_id' => $accountId,
                'name' => $name,
                'profession' => 'Thief',
                'level' => $level,
                'equipment' => json_encode([]),
                'observed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('gw2_account_state')->insert([
            'gw2_account_id' => $accountId,
            'observed_at' => now(),
        ]);

        return $accountId;
    }
}
