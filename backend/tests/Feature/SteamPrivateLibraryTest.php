<?php

namespace Tests\Feature;

use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * "Synced" over an empty shelf.
 *
 * An account connected Steam, the job finished in three seconds, the row said
 * `done` and the settings page said "Synced" — and no game arrived. Steam had
 * answered with a 200 and `{"response":{}}`, which is what it sends when an
 * account's Game details privacy is anything but Public. The service read
 * `response.games` with `[]` as the default, so a refusal and an empty
 * library became the same answer.
 *
 * The distinction is in the payload and always has been: Steam sends
 * `game_count` with every real answer — an account owning nothing still gets
 * `{"game_count":0}` — so an empty object means refused and nothing else does.
 *
 * It matters because this is the one failure the reader can fix themselves,
 * and the page was telling them everything had worked.
 */
class SteamPrivateLibraryTest extends TestCase
{
    use RefreshDatabase;

    private function account(): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => User::factory()->create()->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198930694038',
            'sync_status' => 'pending',
        ]);
    }

    private function sync(ConnectedAccount $account): void
    {
        (new SyncSteamLibrary($account->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );
    }

    public function test_a_withheld_library_is_not_a_finished_sync(): void
    {
        Http::fake(['*' => Http::response(['response' => []])]);

        $account = $this->account();
        $this->sync($account);

        $account->refresh();

        $this->assertSame('private', $account->sync_status);
        // Not `done`, which claimed success, and not `error`, which would send
        // the reader looking for a fault on our side and invite a retry that
        // cannot help.
        $this->assertNotSame('done', $account->sync_status);
    }

    public function test_it_says_the_one_thing_that_fixes_it(): void
    {
        Http::fake(['*' => Http::response(['response' => []])]);

        $account = $this->account();
        $this->sync($account);

        // The setting is named, in the words Steam uses for it — a message
        // that only says "something went wrong" leaves the reader nowhere.
        $this->assertStringContainsString('Game details', (string) $account->refresh()->sync_error);
    }

    public function test_an_account_that_owns_nothing_still_counts_as_synced(): void
    {
        // Steam's answer for an empty library, which is a different sentence
        // from its answer for a private one.
        Http::fake([
            '*GetOwnedGames*' => Http::response(['response' => ['game_count' => 0]]),
            '*' => Http::response(['response' => []]),
        ]);

        $account = $this->account();
        $this->sync($account);

        $this->assertSame('done', $account->refresh()->sync_status);
    }

    public function test_nothing_is_written_to_the_shelf_when_steam_declines(): void
    {
        Http::fake(['*' => Http::response(['response' => []])]);

        $account = $this->account();
        $this->sync($account);

        $this->assertSame(0, UserGame::where('user_id', $account->user_id)->count());
    }
}
