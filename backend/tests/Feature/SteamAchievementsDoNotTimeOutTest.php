<?php

namespace Tests\Feature;

use App\Jobs\SyncSteamAchievements;
use App\Jobs\SyncSteamLibrary;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The sync that could not finish, and now does.
 *
 * Steam has no endpoint for "all achievements for this player" — it is one
 * call per game — and SyncSteamLibrary made every one of them inline. One
 * member has 1,916 games with 1,335 of them played, so the job needed 1,335
 * sequential HTTP calls inside the 120 seconds it is allowed: 0.09 seconds per
 * call, against a Steam that answers in about 0.3 at its best. It failed on
 * all three tries, identically, and spent six minutes of the default queue
 * proving an arithmetic certainty.
 *
 * The fix is not a longer timeout — that moves the wall to a bigger library.
 * The work is handed to a job that reads the clock, stops while it still has
 * time to finish cleanly, and passes the remainder to itself.
 */
class SteamAchievementsDoNotTimeOutTest extends TestCase
{
    use RefreshDatabase;

    private function account(User $user): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198000000009',
            'display_name' => 'Chroniclus',
            'sync_status' => 'pending',
            'visibility' => 'public',
        ]);
    }

    public function test_the_library_hands_the_achievements_on_instead_of_fetching_them(): void
    {
        Queue::fake();

        Http::fake([
            '*GetOwnedGames*' => Http::response(['response' => ['games' => [
                ['appid' => 620, 'name' => 'Portal 2', 'playtime_forever' => 600],
                ['appid' => 400, 'name' => 'Portal', 'playtime_forever' => 120],
                // No minutes: nothing to report, so it must not cost a call.
                ['appid' => 70, 'name' => 'Half-Life', 'playtime_forever' => 0],
            ]]]),
            '*GetRecentlyPlayedGames*' => Http::response(['response' => ['games' => []]]),
            '*' => Http::response(['response' => []]),
        ]);

        $user = User::factory()->create();
        $account = $this->account($user);

        (new SyncSteamLibrary($account->id))->handle(
            app(SteamService::class),
            app(GameMatchingService::class),
            app(SessionSuggestionService::class),
        );

        Queue::assertPushed(SyncSteamAchievements::class);

        // The shelf itself is finished here. Achievements arriving later must
        // not leave somebody's library saying "syncing" for an hour.
        $this->assertSame('done', $account->fresh()->sync_status);

        // assertNotSent, not assertNothingSent: the library sync does talk to
        // Steam, and should. The point is that it did not start asking about
        // achievements one game at a time.
        Http::assertNotSent(
            fn ($request) => str_contains($request->url(), 'GetPlayerAchievements')
        );
    }

    public function test_a_game_steam_will_not_answer_for_still_leaves_the_list(): void
    {
        /*
         * The guarantee that the list gets shorter.
         *
         * A game whose call fails every time would otherwise sit at the head
         * and be retried on every pass for ever — the job would run until it
         * hit its pass ceiling and never reach the games behind it. Attempts
         * are counted, not successes, which is why the failure below still
         * ends the work rather than restarting it.
         */
        Queue::fake();

        Http::fake([
            '*GetPlayerAchievements*' => Http::response('', 500),
            '*' => Http::response(['response' => []]),
        ]);

        $user = User::factory()->create();
        $account = $this->account($user);

        (new SyncSteamAchievements($account->id, [
            ['appid' => 620, 'name' => 'Portal 2'],
        ]))->handle(app(SteamService::class), app(GameMatchingService::class));

        Queue::assertNotPushed(SyncSteamAchievements::class);
    }

    public function test_an_account_that_is_gone_is_not_chased(): void
    {
        Queue::fake();

        (new SyncSteamAchievements(999999, [['appid' => 620, 'name' => 'Portal 2']]))
            ->handle(app(SteamService::class), app(GameMatchingService::class));

        Queue::assertNotPushed(SyncSteamAchievements::class);
    }
}
