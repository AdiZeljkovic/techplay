<?php

namespace Tests\Feature;

use App\Jobs\SyncGogLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\GogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The fourth store, and the quietest one.
 *
 * GOG has no OAuth programme for third parties, so this uses the flow the GOG
 * Galaxy client uses — the reader signs in on GOG's own page and pastes the
 * `code` out of the address bar. The same trade the PlayStation link already
 * makes with Sony's mobile app, made deliberately and behind a config flag.
 *
 * GOG says less than any store we read: what an account owns, and nothing
 * else. No playtime — Galaxy keeps that in a local database on the reader's
 * machine — no last-played date, no achievements. So entries land as backlog
 * with no measurement attached, and a zero is never written where an absence
 * is the truth.
 */
class GogLibraryImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.gog.enabled' => true]);
    }

    private function game(string $slug, string $name): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => $name,
            'released' => '2015-05-19',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function account(User $user): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'gog',
            'provider_user_id' => '48000000000000000',
            'access_token' => 'live-token',
            'token_expires_at' => now()->addHour(),
            'sync_status' => 'pending',
        ]);
    }

    /** GOG's two endpoints: what you own, and what those ids are called. */
    private function fakeGog(array $owned, array $products): void
    {
        Http::fake([
            '*embed.gog.com/user/data/games*' => Http::response(['owned' => $owned]),
            '*api.gog.com/products*' => Http::response($products),
        ]);
    }

    private function sync(ConnectedAccount $account): void
    {
        (new SyncGogLibrary($account->id))->handle(
            app(GogService::class),
            app(GameMatchingService::class),
        );
    }

    public function test_owned_games_land_on_the_shelf_as_backlog(): void
    {
        $user = User::factory()->create();
        $this->game('the-witcher-3-wild-hunt', 'The Witcher 3: Wild Hunt');

        $this->fakeGog([1207658930], [[
            'id' => 1207658930,
            'title' => 'The Witcher 3: Wild Hunt',
            'game_type' => 'game',
        ]]);

        $account = $this->account($user);
        $this->sync($account);

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('backlog', $entry->status);
        $this->assertSame(['gog'], $entry->sources);
        // GOG reports no playtime, so nothing claims one. A zero would read as
        // "played for no time at all", which is a measurement GOG never made.
        $this->assertNull($entry->playtime_source);
        $this->assertSame('done', $account->refresh()->sync_status);
    }

    public function test_soundtracks_and_dlc_are_not_games(): void
    {
        $user = User::factory()->create();
        $this->game('the-witcher-3-wild-hunt', 'The Witcher 3: Wild Hunt');

        $this->fakeGog([1207658930, 1207658931], [
            ['id' => 1207658930, 'title' => 'The Witcher 3: Wild Hunt', 'game_type' => 'game'],
            ['id' => 1207658931, 'title' => 'The Witcher 3: Wild Hunt', 'game_type' => 'dlc'],
        ]);

        $this->sync($this->account($user));

        $this->assertSame(1, UserGame::where('user_id', $user->id)->count());
    }

    public function test_a_game_another_store_already_reported_gains_a_source_and_keeps_its_hours(): void
    {
        $user = User::factory()->create();
        $game = $this->game('the-witcher-3-wild-hunt', 'The Witcher 3: Wild Hunt');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'completed',
            'platform' => 'Steam',
            'sources' => ['steam'],
            'playtime_minutes' => 9000,
            'playtime_source' => 'steam',
        ]);

        $this->fakeGog([1207658930], [
            ['id' => 1207658930, 'title' => 'The Witcher 3: Wild Hunt', 'game_type' => 'game'],
        ]);

        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame(['gog', 'steam'], $entry->sources);
        // Neither the reader's status nor Steam's hours are touched — GOG had
        // nothing to add but its own name.
        $this->assertSame('completed', $entry->status);
        $this->assertSame(9000, $entry->playtime_minutes);
    }

    public function test_a_refusal_is_not_reported_as_an_empty_library(): void
    {
        $user = User::factory()->create();

        Http::fake(['*embed.gog.com*' => Http::response([], 401)]);

        $account = $this->account($user);
        $this->sync($account);

        // The lesson Steam taught: "Synced" over an empty shelf is the one
        // answer a reader cannot act on.
        $this->assertSame('error', $account->refresh()->sync_status);
        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_an_expired_connection_says_so_rather_than_failing(): void
    {
        $user = User::factory()->create();

        $account = ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'gog',
            'provider_user_id' => '48000000000000000',
            'access_token' => 'stale',
            'token_expires_at' => now()->subHour(),
            'refresh_token' => null,
            'sync_status' => 'pending',
        ]);

        $this->sync($account);

        $this->assertSame('expired', $account->refresh()->sync_status);
    }

    public function test_the_connect_endpoint_refuses_a_bad_code_in_words_a_reader_can_use(): void
    {
        Sanctum::actingAs(User::factory()->create());

        Http::fake(['*auth.gog.com/token*' => Http::response([
            'error' => 'invalid_grant',
            'error_description' => "Code doesn't exist or is invalid for the client",
        ], 400)]);

        $this->postJson('/api/v1/connected-accounts/gog/connect', ['code' => 'not-a-real-code'])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'once'));
    }

    public function test_the_whole_integration_can_be_switched_off_without_a_deploy(): void
    {
        config(['services.gog.enabled' => false]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/connected-accounts/gog/connect', ['code' => 'whatever-code'])
            ->assertStatus(503);
    }
}
