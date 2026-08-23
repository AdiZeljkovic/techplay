<?php

namespace Tests\Feature;

use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * What Steam sends with every game, and what we used to throw away.
 *
 * `GetOwnedGames` returns a last-played timestamp and a playtime split across
 * Windows, Mac, Linux, the Steam Deck and offline sessions. The import kept the
 * lifetime total and dropped the rest — and set `last_played_at` to `now()` for
 * anything in the fortnight list, null for everything else. On a real library
 * that was 114 games carrying a date between 2016 and 2026, discarded on every
 * single sync.
 */
class SteamPlaytimeHistoryTest extends TestCase
{
    use RefreshDatabase;

    /** 12 Oct 2021, 14:00 UTC. */
    private const LAST_PLAYED = 1634047200;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2018-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function account(User $user): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198000000001',
            'display_name' => 'Chroniclus',
            'sync_status' => 'pending',
            'visibility' => 'public',
        ]);
    }

    private function sync(User $user): void
    {
        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );
    }

    private function fakeLibrary(array $game): void
    {
        Http::fake([
            '*GetOwnedGames*' => Http::response(['response' => ['games' => [$game]]]),
            '*GetRecentlyPlayedGames*' => Http::response(['response' => ['games' => []]]),
            '*GetPlayerAchievements*' => Http::response(['playerstats' => ['success' => false]]),
            '*' => Http::response(['response' => []]),
        ]);
    }

    public function test_the_last_played_date_comes_from_steam_not_from_the_clock(): void
    {
        $user = User::factory()->create();
        $game = $this->game('valheim');

        $this->fakeLibrary([
            'appid' => 892970,
            'name' => 'Valheim',
            'playtime_forever' => 31080,
            'rtime_last_played' => self::LAST_PLAYED,
        ]);

        $this->sync($user);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNotNull($entry->last_played_at);
        $this->assertSame('2021-10-12', $entry->last_played_at->toDateString());
    }

    /** A game bought and never opened carries a zero, which is not a date. */
    public function test_a_game_never_launched_has_no_date(): void
    {
        $user = User::factory()->create();
        $game = $this->game('never-opened');

        $this->fakeLibrary([
            'appid' => 111,
            'name' => 'Never Opened',
            'playtime_forever' => 0,
            'rtime_last_played' => 0,
        ]);

        $this->sync($user);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNull($entry->last_played_at);
        $this->assertSame('backlog', $entry->status);
    }

    public function test_the_device_split_is_kept_and_zeroes_are_not(): void
    {
        $user = User::factory()->create();
        $game = $this->game('hades');

        $this->fakeLibrary([
            'appid' => 1145360,
            'name' => 'Hades',
            'playtime_forever' => 1200,
            'playtime_windows_forever' => 900,
            'playtime_deck_forever' => 300,
            'playtime_mac_forever' => 0,
            'playtime_linux_forever' => 0,
            'playtime_disconnected' => 45,
            'rtime_last_played' => self::LAST_PLAYED,
        ]);

        $this->sync($user);

        $devices = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->value('device_playtime');

        $this->assertSame(900, $devices['windows']);
        $this->assertSame(300, $devices['deck'], 'The one figure nothing else on the web shows a reader.');
        $this->assertSame(45, $devices['offline']);
        $this->assertArrayNotHasKey('mac', $devices, 'A device never used is not a measurement of zero.');
        $this->assertArrayNotHasKey('linux', $devices);
    }

    /**
     * A shelf entry that already exists is brought forward, not left behind.
     *
     * The entry is seeded rather than made by an earlier sync in the same test:
     * `Http::fake()` merges its stubs instead of replacing them, so a second
     * call never takes effect and the job would quietly re-read the first
     * library. That cost me a red test and no bug.
     */
    public function test_a_later_session_moves_the_date_on_an_existing_entry(): void
    {
        $user = User::factory()->create();
        $game = $this->game('factorio');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'played',
            'hours_played' => 10,
            'playtime_minutes' => 600,
            'playtime_source' => 'steam',
            'last_played_at' => '2021-10-12 14:00:00',
        ]);

        $this->fakeLibrary([
            'appid' => 427520,
            'name' => 'Factorio',
            'playtime_forever' => 900,
            'playtime_windows_forever' => 900,
            'rtime_last_played' => 1697119200, // 12 Oct 2023
        ]);

        $this->sync($user);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertSame('2023-10-12', $entry->last_played_at->toDateString());
        $this->assertSame(900, $entry->playtime_minutes);
        $this->assertSame(900, $entry->device_playtime['windows']);
        $this->assertSame('played', $entry->status, 'The reader\'s own status is not touched by a playtime update.');
    }
}
