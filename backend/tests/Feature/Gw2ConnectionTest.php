<?php

namespace Tests\Feature;

use App\Jobs\SyncGw2Account;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\Gw2\AccountSync;
use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2Connection;
use App\Services\Gw2\Gw2RateLimited;
use App\Services\Gw2\Gw2Unavailable;
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

    /**
     * The button that asks for a full read had never once produced one.
     *
     * Carbon 3 made diffInMinutes signed, so `now()->diffInMinutes($past)` came
     * out negative, always under sixty, and every press was answered "read less
     * than an hour ago". Both halves are checked because a fix that made it
     * always queue would pass the first half alone.
     */
    public function test_a_full_read_can_be_asked_for_again_once_an_hour_has_passed(): void
    {
        Queue::fake();

        $connection = $this->connect();

        DB::table('gw2_accounts')->where('connected_account_id', $connection->id)
            ->update(['last_full_sync_at' => now()->subMinutes(90)]);

        $this->actingAs($connection->user)
            ->postJson('/api/v1/gw2/sync?full=1')
            ->assertOk()
            ->assertJsonPath('message', 'Reading your account.');

        Queue::assertPushed(SyncGw2Account::class, fn (SyncGw2Account $job) => $job->quick === false);

        Queue::fake();

        DB::table('gw2_accounts')->where('connected_account_id', $connection->id)
            ->update(['last_full_sync_at' => now()->subMinutes(10)]);

        $this->actingAs($connection->user)
            ->postJson('/api/v1/gw2/sync?full=1')
            ->assertOk()
            ->assertJsonPath('message', 'Your account was fully read less than an hour ago.');

        Queue::assertNothingPushed();
    }

    public function test_a_rate_limit_during_the_story_read_keeps_the_story_already_known(): void
    {
        $connection = $this->connect();
        $sync = app(AccountSync::class);

        $this->api->quests = [101, 102, 103];
        $sync->full($connection);

        // The budget runs out between the account endpoints and the per-character
        // story loop — the one place a full read swallowed it.
        $this->api->rateLimitQuests = true;
        $sync->full($connection);

        $quests = json_decode(DB::table('gw2_characters')->value('quests'), true);

        // Not read is not empty. Writing [] here is what used to wipe it.
        $this->assertSame([101, 102, 103], $quests);
    }

    public function test_arena_net_failing_after_the_key_check_is_explained_not_a_500(): void
    {
        $user = User::factory()->create();

        // tokeninfo answers; the account read after it does not.
        $this->api->failOn = 'account';

        $this->actingAs($user)
            ->postJson('/api/v1/gw2/connect', ['api_key' => Gw2Stub::KEY])
            ->assertStatus(422)
            ->assertJsonValidationErrors('api_key');

        $this->assertDatabaseCount('connected_accounts', 0);
    }

    /**
     * A sync that runs out of attempts has to say so.
     *
     * Before failed() existed, a job that exhausted its retries left the row
     * at "syncing" or "pending" for good — and so did a rate limit on the last
     * attempt, because a release past `tries` is never run again.
     */
    public function test_a_sync_that_runs_out_of_attempts_says_so(): void
    {
        $connection = $this->connect();

        $connection->forceFill(['sync_status' => 'syncing'])->save();

        (new SyncGw2Account($connection->id))->failed(new \RuntimeException('worker killed'));

        $this->assertSame('error', $connection->fresh()->sync_status);
        $this->assertNotNull($connection->fresh()->sync_error);

        // The last attempt, rate limited: an answer, not another release.
        $connection->forceFill(['sync_status' => 'pending', 'sync_error' => null])->save();
        $this->api->rateLimitEverything = true;

        $job = new SyncGw2Account($connection->id, quick: true);
        $queued = \Mockery::mock(\Illuminate\Contracts\Queue\Job::class);
        $queued->shouldReceive('attempts')->andReturn($job->tries);
        $queued->shouldNotReceive('release');
        $job->setJob($queued);

        $job->handle(app(AccountSync::class));

        $this->assertSame('error', $connection->fresh()->sync_status);
        $this->assertStringContainsString('too busy', $connection->fresh()->sync_error);
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

    /** @var array<int, int> Completed quest ids, for every character. */
    public array $quests = [];

    /** The per-character story read answers 429. */
    public bool $rateLimitQuests = false;

    /** Every account read answers 429. */
    public bool $rateLimitEverything = false;

    /** One account path that answers as if ArenaNet were down. */
    public ?string $failOn = null;

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
        if ($this->rateLimitEverything) {
            throw new Gw2RateLimited("Stub: rate limited on /{$path}.");
        }

        if ($this->failOn === $path) {
            throw new Gw2Unavailable("Stub: /{$path} is down.");
        }

        if (str_starts_with($path, 'characters/') && str_ends_with($path, '/quests')) {
            if ($this->rateLimitQuests) {
                throw new Gw2RateLimited("Stub: rate limited on /{$path}.");
            }

            return $this->quests;
        }

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
