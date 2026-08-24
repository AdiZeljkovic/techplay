<?php

namespace Tests\Feature;

use App\Jobs\SyncEpicLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\EpicService;
use App\Services\GameMatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The Epic library, which Epic does not offer.
 *
 * Epic Account Services — the OAuth a website is invited to use — has exactly
 * four scopes and none of them returns what somebody owns. So this reads the
 * launcher's own endpoints, the way Legendary and Heroic do, with a code the
 * reader fetches from Epic while signed in. The same trade already made for
 * Sony and GOG, made a third time on purpose and behind a flag.
 *
 * Two things about Epic's answer shape the job. The list it returns is
 * *artifacts*, not games — engine builds, plugins, soundtracks and DLC arrive
 * in the same array as Control and Alan Wake — so the catalogue decides what a
 * game is. And Epic reports no playtime, no last-played date and no
 * achievements a third party may read, so nothing here writes a measurement
 * Epic never made.
 */
class EpicLibraryImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.epic.enabled' => true]);
    }

    private function game(string $slug, string $name): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => $name,
            'released' => '2019-08-27',
            'genres' => ['Action'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function account(User $user): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'epic',
            'provider_user_id' => 'ac1d0000000000000000000000000000',
            'access_token' => 'live-token',
            'token_expires_at' => now()->addHour(),
            'sync_status' => 'pending',
        ]);
    }

    /**
     * Epic's two endpoints: the artifacts an account owns, and what the
     * catalogue calls them.
     *
     * @param  array<int,array{appName:string,namespace:string,catalogItemId:string}>  $assets
     * @param  array<string,mixed>  $catalogue
     */
    private function fakeEpic(array $assets, array $catalogue): void
    {
        Http::fake([
            '*launcher-public-service*' => Http::response($assets),
            '*catalog-public-service*' => Http::response($catalogue),
        ]);
    }

    private function sync(ConnectedAccount $account): void
    {
        (new SyncEpicLibrary($account->id))->handle(
            app(EpicService::class),
            app(GameMatchingService::class),
        );
    }

    public function test_owned_games_land_on_the_shelf_as_backlog(): void
    {
        $user = User::factory()->create();
        $this->game('control', 'Control');

        $this->fakeEpic(
            [['appName' => 'Calypso', 'namespace' => 'ns1', 'catalogItemId' => 'cat1']],
            ['cat1' => ['title' => 'Control', 'categories' => [['path' => 'games']]]],
        );

        $account = $this->account($user);
        $this->sync($account);

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('backlog', $entry->status);
        $this->assertSame(['epic'], $entry->sources);
        // Epic reports no playtime, so nothing claims one.
        $this->assertNull($entry->playtime_source);
        $this->assertSame('done', $account->refresh()->sync_status);
    }

    public function test_engine_builds_and_plugins_are_not_games(): void
    {
        $user = User::factory()->create();
        $this->game('control', 'Control');
        $this->game('unreal-engine', 'Unreal Engine');

        $this->fakeEpic(
            [
                ['appName' => 'Calypso', 'namespace' => 'ns1', 'catalogItemId' => 'cat1'],
                ['appName' => 'UE_5.4', 'namespace' => 'ns1', 'catalogItemId' => 'engine'],
            ],
            [
                'cat1' => ['title' => 'Control', 'categories' => [['path' => 'games']]],
                // The engine is filed under `engines`, never `games`.
                'engine' => ['title' => 'Unreal Engine', 'categories' => [['path' => 'engines']]],
            ],
        );

        $this->sync($this->account($user));

        $this->assertSame(1, UserGame::where('user_id', $user->id)->count());
        $this->assertSame('control', UserGame::where('user_id', $user->id)->first()->game->slug);
    }

    public function test_a_season_pass_is_not_the_game_it_belongs_to(): void
    {
        $user = User::factory()->create();
        $this->game('control', 'Control');

        $this->fakeEpic(
            [
                ['appName' => 'Calypso', 'namespace' => 'ns1', 'catalogItemId' => 'cat1'],
                ['appName' => 'CalypsoPass', 'namespace' => 'ns1', 'catalogItemId' => 'pass'],
            ],
            [
                'cat1' => ['title' => 'Control', 'categories' => [['path' => 'games']]],
                // Filed under games, but hanging off another item — which is
                // the only thing that tells a pass from the game it extends.
                'pass' => [
                    'title' => 'Control',
                    'categories' => [['path' => 'games']],
                    'mainGameItem' => ['id' => 'cat1'],
                ],
            ],
        );

        $this->sync($this->account($user));

        $this->assertSame(1, UserGame::where('user_id', $user->id)->count());
    }

    public function test_a_game_another_store_reported_gains_a_source_and_keeps_its_hours(): void
    {
        $user = User::factory()->create();
        $game = $this->game('control', 'Control');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'completed',
            'platform' => 'Steam',
            'sources' => ['steam'],
            'playtime_minutes' => 3000,
            'playtime_source' => 'steam',
        ]);

        $this->fakeEpic(
            [['appName' => 'Calypso', 'namespace' => 'ns1', 'catalogItemId' => 'cat1']],
            ['cat1' => ['title' => 'Control', 'categories' => [['path' => 'games']]]],
        );

        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame(['epic', 'steam'], $entry->sources);
        $this->assertSame('completed', $entry->status);
        $this->assertSame(3000, $entry->playtime_minutes);
    }

    public function test_a_refusal_is_not_reported_as_an_empty_library(): void
    {
        $user = User::factory()->create();

        Http::fake(['*launcher-public-service*' => Http::response([], 401)]);

        $account = $this->account($user);
        $this->sync($account);

        $this->assertSame('error', $account->refresh()->sync_status);
        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_an_expired_connection_says_so(): void
    {
        $user = User::factory()->create();

        $account = ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'epic',
            'provider_user_id' => 'ac1d0000000000000000000000000000',
            'access_token' => 'stale',
            'token_expires_at' => now()->subHour(),
            'refresh_token' => null,
            'sync_status' => 'pending',
        ]);

        $this->sync($account);

        $this->assertSame('expired', $account->refresh()->sync_status);
    }

    public function test_the_connect_endpoint_explains_a_dead_code(): void
    {
        Sanctum::actingAs(User::factory()->create());

        // Epic's own wording for a code that was used or aged out — measured
        // against the live endpoint, which accepts these credentials and
        // rejects only the code.
        Http::fake(['*account-public-service*' => Http::response([
            'errorCode' => 'errors.com.epicgames.account.oauth.authorization_code_not_found',
        ], 400)]);

        $this->postJson('/api/v1/connected-accounts/epic/connect', ['code' => 'deadcode123'])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'single-use'));
    }

    public function test_the_whole_integration_can_be_switched_off_without_a_deploy(): void
    {
        config(['services.epic.enabled' => false]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/connected-accounts/epic/connect', ['code' => 'whatever-code'])
            ->assertStatus(503);
    }
}
