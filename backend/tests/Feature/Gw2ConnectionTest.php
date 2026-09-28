<?php

namespace Tests\Feature;

use App\Jobs\SyncGw2Account;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\AccountSync;
use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2Connection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The Guild Wars 2 connection, without ArenaNet.
 *
 * A stub client stands in for the real one so none of this touches the network
 * or the shared rate limit. What is being tested is not the HTTP — that was
 * measured against the live API — but the four things that would each be a
 * quiet bug: the key leaking into a response, a quick sync blanking what only
 * a full sync reads, history being invented on the first read, and a
 * disconnect leaving derived data behind.
 */
class Gw2ConnectionTest extends TestCase
{
    use RefreshDatabase;

    private Gw2Stub $api;

    protected function setUp(): void
    {
        parent::setUp();

        $this->api = new Gw2Stub;
        $this->app->instance(Gw2Client::class, $this->api);
    }

    public function test_connecting_stores_the_account_and_never_returns_the_key(): void
    {
        Queue::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/gw2/connect', ['api_key' => Gw2Stub::KEY]);

        $response->assertOk()->assertJsonPath('data.account_name', 'Garamel.6452');

        // The whole body, not just the fields we thought to name. A key that
        // reaches a client is a key in somebody's browser history.
        $this->assertStringNotContainsString(Gw2Stub::KEY, $response->getContent());

        $this->assertDatabaseHas('gw2_accounts', ['arena_account_id' => 'ABC-123']);

        // Stored encrypted, but readable back by us — otherwise no sync can run.
        $connection = ConnectedAccount::where('user_id', $user->id)->sole();
        $this->assertSame(Gw2Stub::KEY, $connection->access_token);
        $this->assertNotSame(Gw2Stub::KEY, $connection->getAttributes()['access_token']);

        Queue::assertPushed(SyncGw2Account::class);
    }

    public function test_a_key_without_progression_is_refused_before_anything_is_stored(): void
    {
        $user = User::factory()->create();
        $this->api->permissions = ['account', 'characters'];

        $this->actingAs($user)
            ->postJson('/api/v1/gw2/connect', ['api_key' => Gw2Stub::KEY])
            ->assertStatus(422)
            ->assertJsonValidationErrors('api_key');

        $this->assertDatabaseCount('gw2_accounts', 0);
        $this->assertDatabaseCount('connected_accounts', 0);
    }

    public function test_a_missing_optional_scope_is_named_rather_than_silently_dropped(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $this->api->permissions = ['account', 'progression'];

        $this->actingAs($user)
            ->postJson('/api/v1/gw2/connect', ['api_key' => Gw2Stub::KEY])
            ->assertOk()
            ->assertJsonPath('data.missing_features.wallet', 'your currencies, for goal and material planning');
    }

    public function test_the_first_read_records_what_was_already_cleared(): void
    {
        $connection = $this->connect();

        app(AccountSync::class)->full($connection);

        /*
         * This is the loss that made the baseline necessary, and it is worth
         * spelling out because the first version of this test asserted the
         * opposite.
         *
         * /v2/account/raids reports the current week and nothing else. An
         * account connecting on Thursday having cleared an encounter has it in
         * the first read, in a state row that the next weekly reset overwrites
         * with an empty list. On 28 September 2026 exactly that happened: four
         * encounters observed at connect, zero rows in the event table, and
         * nothing anywhere to recover them from.
         */
        $this->assertDatabaseHas('gw2_progress_events', ['type' => 'raid_encounter_cleared']);

        $event = DB::table('gw2_progress_events')->where('type', 'raid_encounter_cleared')->first();
        $payload = json_decode($event->payload, true);

        // Marked, so a reader can tell "you cleared this on Thursday" from
        // "this was already done when you arrived".
        $this->assertTrue($payload['baseline']);
        $this->assertSame('spirit_woods', $payload['id']);

        // Achievements stay out of it. 364 completed achievements is a wall,
        // not a history — and unlike raids they can be read back in full at any
        // time.
        $this->assertDatabaseMissing('gw2_progress_events', ['type' => 'achievement_completed']);

        $this->assertDatabaseCount('gw2_characters', 1);
        $this->assertDatabaseHas('gw2_item_ledger', ['item_id' => 19721, 'location_type' => 'materials']);
    }

    public function test_a_baseline_is_dated_to_the_connection_not_to_the_read(): void
    {
        $connection = $this->connect();

        $this->travel(3)->hours();
        app(AccountSync::class)->full($connection);

        $connectedAt = DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->value('created_at');
        $occurredAt = DB::table('gw2_progress_events')->value('occurred_at');

        // Dating it to the read would claim the player did all of it in the
        // second they pasted their key.
        $this->assertSame((string) $connectedAt, (string) $occurredAt);
    }

    public function test_the_second_read_records_only_what_changed(): void
    {
        $connection = $this->connect();
        $sync = app(AccountSync::class);

        $sync->full($connection);

        $this->api->raids = ['spirit_woods', 'keep_construct'];
        $this->api->achievements = [
            ['id' => 1, 'done' => true],
            ['id' => 2, 'done' => true],
            // Progress that is real but is not an event. There are eight
            // thousand achievements; a feed of 3/10 → 4/10 is unreadable.
            ['id' => 3, 'done' => false, 'current' => 4],
        ];

        $sync->full($connection);

        /*
         * Baselines excluded. Those describe what was already done at connect
         * and are a different claim from "this happened between two reads",
         * which is what this test is about.
         */
        $types = DB::table('gw2_progress_events')
            ->orderBy('id')
            ->get(['type', 'payload'])
            ->reject(fn ($e) => json_decode($e->payload, true)['baseline'] ?? false)
            ->pluck('type')
            ->all();

        $this->assertSame(['raid_encounter_cleared', 'achievement_completed'], $types);
    }

    public function test_a_quick_sync_does_not_blank_what_only_a_full_sync_reads(): void
    {
        $connection = $this->connect();
        $sync = app(AccountSync::class);

        $sync->full($connection);
        $sync->quick($connection);

        $state = DB::table('gw2_account_state')->sole();

        // A quick sync reads six endpoints. The other columns have to keep
        // what the last full read left, not be overwritten with nothing.
        $this->assertNotNull($state->wallet);
        $this->assertNotNull($state->masteries);
        $this->assertNotNull($state->unlocks);

        // And it must not disturb the ledger, which it never read: one
        // material, one bank stack, one bag slot, one worn piece.
        $this->assertDatabaseCount('gw2_item_ledger', 4);
    }

    public function test_reconnecting_the_same_key_keeps_the_date_we_started_watching(): void
    {
        $connection = $this->connect();

        $first = DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->value('created_at');

        $this->travel(2)->days();
        $this->connect($connection->user);

        $this->assertSame(
            $first,
            DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->value('created_at'),
            'created_at bounds how far the progress history can reach; reconnecting must not move it.'
        );
    }

    public function test_disconnecting_leaves_nothing_derived_behind(): void
    {
        $connection = $this->connect();
        app(AccountSync::class)->full($connection);

        $this->actingAs($connection->user)
            ->deleteJson('/api/v1/gw2/connection')
            ->assertOk();

        // The connect screen promises this. The cascade is what makes it true.
        foreach (['gw2_accounts', 'gw2_characters', 'gw2_account_state', 'gw2_item_ledger', 'gw2_progress_events'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    public function test_one_game_account_cannot_be_claimed_by_two_profiles(): void
    {
        $this->connect();

        $other = User::factory()->create();

        $this->actingAs($other)
            ->postJson('/api/v1/gw2/connect', ['api_key' => Gw2Stub::KEY])
            ->assertStatus(422)
            ->assertJsonValidationErrors('api_key');
    }

    private function connect(?User $user = null): ConnectedAccount
    {
        return app(Gw2Connection::class)->connect($user ?? User::factory()->create(), Gw2Stub::KEY);
    }
}

/**
 * The API, as observed on 28 September 2026, cut down to the shapes that matter.
 *
 * `specializations` is an object keyed by game mode while `equipment` is a list
 * — that asymmetry is real and is the sort of thing a hand-written fixture
 * quietly smooths over.
 */
class Gw2Stub extends Gw2Client
{
    public const KEY = 'C6BBD845-DD9F-C84D-80E3-A976646FDDE3-BBAE5D91-1248-4243-BAA3-E519923C5B19';

    /** @var array<int, string> */
    public array $permissions = [
        'account', 'progression', 'wallet', 'inventories', 'unlocks', 'characters', 'builds',
    ];

    /** @var array<int, string> */
    public array $raids = ['spirit_woods'];

    /** @var array<int, array<string, mixed>> */
    public array $achievements = [
        ['id' => 1, 'done' => true],
        ['id' => 3, 'done' => false, 'current' => 3],
    ];

    public function __construct()
    {
        parent::__construct('gw2:test');
    }

    public function tokenInfo(string $key): array
    {
        return ['id' => 'key-1', 'name' => 'Crafting', 'permissions' => $this->permissions];
    }

    public function account(string $path, string $key, array $query = []): array
    {
        return match ($path) {
            'account' => [
                'id' => 'ABC-123',
                'name' => 'Garamel.6452',
                'world' => 2003,
                'fractal_level' => 6,
                'daily_ap' => 3000,
                'monthly_ap' => 100,
                'wvw_rank' => 12,
                'created' => '2015-01-01T00:00:00Z',
                'access' => ['GuildWars2', 'PathOfFire'],
            ],
            'account/achievements' => $this->achievements,
            'account/raids' => $this->raids,
            'account/worldbosses' => [],
            'account/masteries' => [['id' => 1, 'level' => 4]],
            'account/mastery/points' => ['totals' => [], 'unspent' => []],
            'account/wallet' => [['id' => 1, 'value' => 500]],
            'account/materials' => [['id' => 19721, 'count' => 42, 'category' => 5]],
            'account/bank' => [null, ['id' => 24295, 'count' => 10]],
            'account/inventory' => [],
            'account/recipes' => [7, 8],
            'account/legendaryarmory' => [],
            'account/mounts/types' => ['raptor'],
            'account/progression' => [],
            'account/dailycrafting' => [],
            'account/wizardsvault/daily' => ['meta_progress_current' => 1],
            'account/wizardsvault/weekly' => ['meta_progress_current' => 2],
            'characters' => [[
                'name' => 'Isara Moonbloom',
                'profession' => 'Thief',
                'race' => 'Human',
                'level' => 80,
                'age' => 900,
                'deaths' => 520,
                'created' => '2015-02-02T00:00:00Z',
                'equipment' => [['id' => 80248, 'slot' => 'WeaponA1']],
                'specializations' => ['pve' => [['id' => 7, 'traits' => [1, 2, 3]]], 'pvp' => [], 'wvw' => []],
                'skills' => ['pve' => ['heal' => 13, 'utilities' => []], 'pvp' => [], 'wvw' => []],
                'crafting' => [['discipline' => 'Chef', 'rating' => 400, 'active' => true]],
                'bags' => [null, ['id' => 1, 'size' => 20, 'inventory' => [null, ['id' => 24295, 'count' => 3]]]],
            ]],
            default => [],
        };
    }
}
