<?php

namespace Tests\Feature;

use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\SteamAchievement;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * What Steam can and cannot tell us about finishing a game.
 *
 * A full achievement list is the closest thing it has to "I finished this" —
 * the same reading the PlayStation import already takes from a full trophy
 * list. Nothing took it on the Steam side, so the Completed shelf stayed empty
 * no matter what its owner had played through.
 */
class SteamCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2020-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    /** A Steam library of one game, with the achievement list we choose. */
    private function fakeSteam(int $appId, string $name, int $minutes, array $achievements): void
    {
        Http::fake([
            '*GetOwnedGames*' => Http::response(['response' => ['games' => [
                ['appid' => $appId, 'name' => $name, 'playtime_forever' => $minutes],
            ]]]),
            '*GetRecentlyPlayedGames*' => Http::response(['response' => ['games' => []]]),
            '*GetPlayerAchievements*' => Http::response(['playerstats' => [
                'success' => true,
                'achievements' => $achievements,
            ]]),
            '*' => Http::response(['response' => []]),
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

    private function ach(string $name, bool $achieved): array
    {
        return ['apiname' => $name, 'name' => ucfirst($name), 'description' => 'd', 'achieved' => $achieved ? 1 : 0, 'unlocktime' => $achieved ? 1695484524 : 0];
    }

    public function test_every_achievement_earned_marks_the_game_completed(): void
    {
        $user = User::factory()->create();
        $game = $this->game('portal-2');

        $this->fakeSteam(620, 'Portal 2', 600, [
            $this->ach('one', true),
            $this->ach('two', true),
        ]);

        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNotNull($entry);
        $this->assertSame('completed', $entry->status);
        $this->assertSame(100, (int) $entry->progress);
    }

    public function test_a_partial_list_is_played_not_completed(): void
    {
        $user = User::factory()->create();
        $game = $this->game('witcher-3');

        $this->fakeSteam(292030, 'Witcher 3', 6060, [
            $this->ach('one', true),
            $this->ach('two', false),
        ]);

        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertSame('played', $entry->status, 'Hours on the clock, but Steam never said it was finished.');
    }

    /** A reader's own answer outranks anything the importer infers. */
    public function test_a_status_the_reader_chose_is_not_overwritten(): void
    {
        $user = User::factory()->create();
        $game = $this->game('lost-ark');

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'dropped',
        ]);

        $this->fakeSteam(1599340, 'Lost Ark', 3900, [
            $this->ach('one', true),
            $this->ach('two', true),
        ]);

        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        $this->assertSame('dropped', UserGame::where('user_id', $user->id)->where('game_id', $game->id)->value('status'));
    }

    /**
     * The words, which never arrived.
     *
     * GetPlayerAchievements answers with the bare api name unless a language
     * is asked for, so the first real import stored 448 achievements with a
     * null display_name apiece and the profile panel had nothing to print.
     */
    public function test_the_request_asks_steam_for_a_language(): void
    {
        $user = User::factory()->create();
        $this->game('portal-2');

        $this->fakeSteam(620, 'Portal 2', 600, [$this->ach('one', true)]);

        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        Http::assertSent(fn ($request) => ! str_contains($request->url(), 'GetPlayerAchievements')
            || str_contains($request->url(), 'l=english'));

        $this->assertSame('One', SteamAchievement::where('user_id', $user->id)->value('display_name'));
    }

    /** A game with no minutes on it has nothing to report, and is not asked. */
    public function test_an_unplayed_game_is_not_asked_about(): void
    {
        $user = User::factory()->create();
        $this->game('never-launched');

        $this->fakeSteam(999999, 'Never Launched', 0, [$this->ach('one', true)]);

        (new SyncSteamLibrary($this->account($user)->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'GetPlayerAchievements'));
    }
}
