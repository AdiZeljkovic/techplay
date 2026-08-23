<?php

namespace Tests\Feature;

use App\Jobs\SyncXboxLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\OpenXblService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * What Xbox can say, and what we were failing to hear.
 *
 * Xbox reports no playtime at all — measured on the raw payload, `stats` comes
 * back as `{"sourceVersion":3}` and there is no minutes field anywhere. That
 * is Microsoft's limit and nothing here can change it.
 *
 * The three things it *does* keep current were being dropped:
 *
 *   a re-sync skipped every row it had already imported, so a library went
 *   stale the moment it was linked — last-played never moved again and
 *   achievement progress never caught up;
 *
 *   a game with every achievement earned stayed "played", though that is the
 *   same reading the Steam import takes as finished;
 *
 *   and `platform` was stamped by whichever importer arrived first, so 37 rows
 *   on the live shelf wore an Xbox mark over hours Steam had reported —
 *   Morrowind at 243 of them, Skyrim at 156.
 */
class XboxLibraryDepthTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2019-01-01',
            'genres' => ['Action'],
            'platforms' => ['Xbox'],
            'tags' => [],
        ]);
    }

    /** One Xbox title, as OpenXBL returns it. */
    private function fakeTitles(string $name, int $progress, ?string $lastPlayed): void
    {
        // Nested under `content`, which is where the real endpoint puts it —
        // checked against the live response rather than assumed.
        Http::fake(['*xbl.io*' => Http::response(['content' => ['titles' => [[
            'titleId' => '2054716369',
            'name' => $name,
            'type' => 'Game',
            'achievement' => ['progressPercentage' => $progress],
            'titleHistory' => $lastPlayed ? ['lastTimePlayed' => $lastPlayed] : [],
        ]]]])]);
    }

    private function account(User $user): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'xbox',
            'provider_user_id' => '2533274884774855',
            'sync_status' => 'pending',
        ]);
    }

    private function sync(ConnectedAccount $account): void
    {
        (new SyncXboxLibrary($account->id))->handle(
            app(OpenXblService::class),
            app(GameMatchingService::class),
        );
    }

    public function test_a_re_sync_moves_the_date_and_the_progress_forward(): void
    {
        $user = User::factory()->create();
        $game = $this->game('it-takes-two');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'played',
            'platform' => 'Xbox',
            'sources' => ['xbox'],
            'progress' => 20,
            'last_played_at' => '2026-01-01 10:00:00',
        ]);

        $this->fakeTitles('It Takes Two', 60, '2026-08-01T12:00:00Z');
        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame(60, $entry->progress);
        $this->assertSame('2026-08-01', $entry->last_played_at->format('Y-m-d'));
    }

    public function test_a_date_is_never_walked_backwards(): void
    {
        $user = User::factory()->create();
        $game = $this->game('halo');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'played',
            'progress' => 80,
            // Steam may hold a later date for the same game on another store.
            'last_played_at' => '2026-08-20 10:00:00',
        ]);

        $this->fakeTitles('Halo', 10, '2026-02-01T12:00:00Z');
        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('2026-08-20', $entry->last_played_at->format('Y-m-d'));
        $this->assertSame(80, $entry->progress);
    }

    public function test_every_achievement_earned_reads_as_finished(): void
    {
        $user = User::factory()->create();
        $this->game('forza');

        $this->fakeTitles('Forza', 100, '2026-07-01T12:00:00Z');
        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        $this->assertSame('completed', $entry->status);
        $this->assertNotNull($entry->completed_at);
    }

    public function test_a_status_the_reader_chose_is_left_alone(): void
    {
        $user = User::factory()->create();
        $game = $this->game('gears');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            // Their verdict, not an importer's guess.
            'status' => 'dropped',
            'progress' => 100,
        ]);

        $this->fakeTitles('Gears', 100, '2026-07-01T12:00:00Z');
        $this->sync($this->account($user));

        $this->assertSame('dropped', UserGame::where('user_id', $user->id)->first()->status);
    }

    public function test_a_second_store_is_added_to_the_provenance_not_swapped_in(): void
    {
        $user = User::factory()->create();
        $game = $this->game('morrowind');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'played',
            'platform' => 'Steam',
            'sources' => ['steam'],
            'playtime_minutes' => 14580,
            'playtime_source' => 'steam',
        ]);

        $this->fakeTitles('Morrowind', 30, '2026-05-01T12:00:00Z');
        $this->sync($this->account($user));

        $entry = UserGame::where('user_id', $user->id)->first();

        // Both, in a stable order — the game really is on two stores, and the
        // hours it carries are Steam's.
        $this->assertSame(['steam', 'xbox'], $entry->sources);
        $this->assertSame(14580, $entry->playtime_minutes);
    }

    public function test_a_fresh_import_records_where_it_came_from(): void
    {
        $user = User::factory()->create();
        $this->game('sea-of-thieves');

        $this->fakeTitles('Sea of Thieves', 5, '2026-08-10T12:00:00Z');
        $this->sync($this->account($user));

        $this->assertSame(['xbox'], UserGame::where('user_id', $user->id)->first()->sources);
    }
}
