<?php

namespace Tests\Feature;

use App\Jobs\RefreshRecentSteamPlaytime;
use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\PresenceService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Playing something is supposed to be visible while you are playing it.
 *
 * Three mechanisms each did their own job correctly and left a gap between
 * them, which showed up as: play a game for three hours, and the profile goes
 * on calling it unplayed.
 *
 * - Presence knows what is running right now, but shelved games with a
 *   firstOrCreate, which does nothing when the row is already there — and after
 *   a library import the row is always there.
 * - The Steam import updates hours and deliberately never revisits status, so
 *   it cannot overwrite a member's own filing. It also could not correct the
 *   `backlog` it wrote itself on a day the game had no minutes on it.
 * - The full sync is weekly and skips accounts synced in the last six days, so
 *   hours could stand still for a week, and a game bought on Thursday did not
 *   exist here until the following Wednesday.
 */
class PlayingAGameLeavesTheBacklogTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug, string $name): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => $name,
            'released' => '2019-02-15',
            'genres' => ['Shooter'],
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
            'sync_status' => 'done',
            'visibility' => 'public',
        ]);
    }

    private function refresh(): void
    {
        (new RefreshRecentSteamPlaytime)->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );
    }

    private function fakeRecent(array $games): void
    {
        Http::fake([
            '*GetRecentlyPlayedGames*' => Http::response(['response' => ['games' => $games]]),
            '*' => Http::response(['response' => []]),
        ]);
    }

    // ── Presence ────────────────────────────────────────────────────────────

    /**
     * The reported case: a game imported as backlog, then played for hours.
     */
    #[Test]
    public function a_game_already_on_the_shelf_leaves_the_backlog_when_you_play_it(): void
    {
        $user = User::factory()->create();
        $game = $this->game('metro-exodus-enhanced', 'Metro Exodus: Enhanced Edition');
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'backlog']);

        $service = app(PresenceService::class);
        $service->set($user, 'Metro Exodus: Enhanced Edition', 'steam');
        Presence::where('user_id', $user->id)->update(['started_at' => now()->subMinutes(40)]);
        $service->set($user, 'Metro Exodus: Enhanced Edition', 'steam');

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('playing', $entry->status);
        $this->assertNotNull($entry->last_played_at);
    }

    /**
     * A wishlist entry is deliberately not promoted: a presence string matched
     * to the wrong game must never be able to quietly empty a wishlist.
     */
    #[Test]
    public function a_wishlisted_game_is_left_where_it_is(): void
    {
        $user = User::factory()->create();
        $game = $this->game('metro-exodus-enhanced', 'Metro Exodus: Enhanced Edition');
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'wishlist']);

        $service = app(PresenceService::class);
        $service->set($user, 'Metro Exodus: Enhanced Edition', 'steam');
        Presence::where('user_id', $user->id)->update(['started_at' => now()->subMinutes(40)]);
        $service->set($user, 'Metro Exodus: Enhanced Edition', 'steam');

        $this->assertSame('wishlist', UserGame::where('user_id', $user->id)->first()->status);
    }

    // ── Matching ────────────────────────────────────────────────────────────

    /**
     * Steam writes "Metro: Last Light Complete Edition" with nothing between
     * the title and the edition. The suffix rule wanted a dash or a colon, so
     * twenty real hours never reached a shelf entry that already existed.
     */
    #[Test]
    public function an_edition_with_no_separator_still_finds_its_game(): void
    {
        $game = $this->game('metro-last-light', 'Metro: Last Light');

        $match = app(GameMatchingService::class)->matchSteamGame(43160, 'Metro: Last Light Complete Edition');

        $this->assertNotNull($match);
        $this->assertSame($game->id, $match->id);
    }

    /**
     * And a game genuinely catalogued under its edition still matches itself:
     * the fallback only runs after an exact name and a slug have both missed.
     */
    #[Test]
    public function a_game_catalogued_under_its_edition_matches_itself(): void
    {
        $this->game('some-game', 'Some Game');
        $edition = $this->game('some-game-complete-edition', 'Some Game Complete Edition');

        $match = app(GameMatchingService::class)->matchSteamGame(999001, 'Some Game Complete Edition');

        $this->assertSame($edition->id, $match?->id);
    }

    // ── The half-hourly refresh ─────────────────────────────────────────────

    /**
     * Bought on Thursday, played the same evening. This used to wait for
     * Wednesday.
     */
    #[Test]
    public function a_game_bought_and_played_today_reaches_the_shelf_today(): void
    {
        $user = User::factory()->create();
        $game = $this->game('helldivers-2', 'Helldivers 2');
        $this->account($user);

        $this->fakeRecent([[
            'appid' => 553850, 'name' => 'Helldivers 2',
            'playtime_2weeks' => 180, 'playtime_forever' => 180,
        ]]);

        $this->refresh();

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNotNull($entry, 'a game played this week should not wait for the weekly sync');
        $this->assertSame('playing', $entry->status);
        $this->assertSame(3, $entry->hours_played);
        // A first reading is a lifetime total, not a session that just
        // happened — so it becomes the floor, not a proposal.
        $this->assertSame(180, (int) $entry->playtime_seen_minutes);
    }

    #[Test]
    public function hours_move_without_waiting_for_the_weekly_sync(): void
    {
        $user = User::factory()->create();
        $game = $this->game('quake-champions', 'Quake Champions');
        $this->account($user);
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'status' => 'backlog', 'hours_played' => 0,
            'playtime_minutes' => 0, 'playtime_seen_minutes' => 0,
        ]);

        $this->fakeRecent([[
            'appid' => 611500, 'name' => 'Quake Champions',
            'playtime_2weeks' => 180, 'playtime_forever' => 300,
        ]]);

        $this->refresh();

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame(300, (int) $entry->playtime_minutes);
        $this->assertSame(5, $entry->hours_played);
        // Backlog with five hours on it is a contradiction, not a filing.
        $this->assertSame('playing', $entry->status);
        $this->assertNotNull($entry->last_played_at);
    }

    #[Test]
    public function a_verdict_the_member_reached_survives_the_refresh(): void
    {
        $user = User::factory()->create();
        $game = $this->game('quake-champions', 'Quake Champions');
        $this->account($user);
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'status' => 'completed', 'playtime_seen_minutes' => 0,
        ]);

        $this->fakeRecent([[
            'appid' => 611500, 'name' => 'Quake Champions',
            'playtime_2weeks' => 60, 'playtime_forever' => 300,
        ]]);

        $this->refresh();

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('completed', $entry->status);
        // The hours still arrive; only the verdict is untouchable.
        $this->assertSame(300, (int) $entry->playtime_minutes);
    }

    /**
     * A full sync walking the same rows would race this one.
     */
    #[Test]
    public function an_account_mid_sync_is_left_alone(): void
    {
        $user = User::factory()->create();
        $this->game('quake-champions', 'Quake Champions');
        $this->account($user)->update(['sync_status' => 'syncing']);

        $this->fakeRecent([[
            'appid' => 611500, 'name' => 'Quake Champions',
            'playtime_2weeks' => 60, 'playtime_forever' => 300,
        ]]);

        $this->refresh();

        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    // ── The weekly sync ─────────────────────────────────────────────────────

    /**
     * The same correction on the path that owns the whole library, so the two
     * cannot disagree about what backlog means.
     */
    #[Test]
    public function the_weekly_sync_corrects_the_backlog_it_wrote_itself(): void
    {
        $user = User::factory()->create();
        $game = $this->game('quake-champions', 'Quake Champions');
        $account = $this->account($user);
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'status' => 'backlog', 'playtime_seen_minutes' => 0,
        ]);

        Http::fake([
            '*GetOwnedGames*' => Http::response(['response' => ['game_count' => 1, 'games' => [[
                'appid' => 611500, 'name' => 'Quake Champions', 'playtime_forever' => 300,
            ]]]]),
            '*GetRecentlyPlayedGames*' => Http::response(['response' => ['games' => []]]),
            '*' => Http::response(['response' => []]),
        ]);

        (new SyncSteamLibrary($account->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        // Not in the fortnight list, so it is `played` rather than `playing`.
        $this->assertSame('played', UserGame::where('user_id', $user->id)->first()->status);
    }
}
