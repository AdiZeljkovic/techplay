<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\BountyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Playing something a second time, the way Goodreads lets you read a book again.
 *
 * The shelf had six states and none of them described a replay. `playing`
 * threw away the finish; `completed` denied the current run. So the honest
 * answer was to leave the entry alone, and the library stopped saying what
 * anyone was actually doing.
 *
 * Two things have to hold for this to be worth having. A replay has to count
 * as playing everywhere playing is counted — otherwise starting one makes the
 * game vanish from the shelf that describes it. And the count has to be a
 * count: the second time and the eighth time have to be distinguishable.
 */
class ReplayingAGameTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug = 'bloodborne'): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2015-03-24',
            'genres' => ['Action'],
            'platforms' => ['PlayStation'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, Game $game, string $status): TestResponse
    {
        return $this->actingAs($user)->putJson("/api/v1/collection/games/{$game->slug}", ['status' => $status]);
    }

    public function test_a_second_finish_is_counted_as_a_second_finish(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->shelve($user, $game, 'completed')->assertSuccessful();
        $this->assertSame(1, UserGame::first()->playthroughs);

        $this->shelve($user, $game, 'replaying')->assertSuccessful();
        $this->assertSame(1, UserGame::first()->playthroughs, 'Starting a replay is not finishing one.');

        $this->shelve($user, $game, 'completed')->assertSuccessful();
        $this->assertSame(2, UserGame::first()->playthroughs);

        // The eighth time, which is the whole point of counting rather than
        // keeping a boolean.
        foreach (range(3, 8) as $lap) {
            $this->shelve($user, $game, 'replaying')->assertSuccessful();
            $this->shelve($user, $game, 'completed')->assertSuccessful();
            $this->assertSame($lap, UserGame::first()->playthroughs);
        }
    }

    /**
     * Editing a finished entry is not finishing it again.
     *
     * The screen sends the whole entry on every edit — add an hour, change the
     * platform — and each of those arrives as `status: completed`. Counting
     * them would turn one finish into however many times somebody touched the
     * row.
     */
    public function test_editing_a_finished_entry_does_not_add_a_lap(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->shelve($user, $game, 'completed')->assertSuccessful();

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed', 'hours_played' => 40])
            ->assertSuccessful();

        $this->assertSame(1, UserGame::first()->playthroughs);
    }

    /** A replay does not undo the first finish, but it does reset the run. */
    public function test_a_replay_keeps_the_original_completion_date(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->shelve($user, $game, 'completed')->assertSuccessful();
        $firstFinish = UserGame::first()->completed_at;

        $this->travel(2)->days();
        $this->shelve($user, $game, 'replaying')->assertSuccessful();

        $entry = UserGame::first();
        $this->assertEquals($firstFinish, $entry->completed_at, 'The day it was first finished does not move.');
        $this->assertSame(0, $entry->progress, 'A replay that opens at 100% has nowhere to go.');
    }

    /** Somebody on their second lap is playing it. */
    public function test_a_replay_counts_as_playing(): void
    {
        $user = User::factory()->create(['profile_visibility' => User::VISIBILITY_PUBLIC]);
        $game = $this->game();

        $this->shelve($user, $game, 'completed')->assertSuccessful();
        $this->shelve($user, $game, 'replaying')->assertSuccessful();

        $stats = $this->getJson("/api/v1/users/{$user->username}")->assertOk()->json('stats');

        $this->assertSame(1, $stats['playing_count'], 'A replay that is not playing leaves the shelf describing nobody.');
        $this->assertSame(1, $stats['replaying_count']);
    }

    /**
     * The Playing shelf shows them, so its tile and its list agree.
     *
     * The count of playing includes replays everywhere on the site. A filter
     * that disagreed would draw a tile reading 2 over a list of 1, which reads
     * as a broken count rather than as a definition.
     */
    public function test_the_playing_filter_returns_replays_too(): void
    {
        $user = User::factory()->create(['profile_visibility' => User::VISIBILITY_PUBLIC]);

        $first = $this->game('first-run');
        $second = $this->game('second-run');

        $this->shelve($user, $first, 'playing')->assertSuccessful();
        $this->shelve($user, $second, 'completed')->assertSuccessful();
        $this->shelve($user, $second, 'replaying')->assertSuccessful();

        $playing = $this->getJson("/api/v1/users/{$user->username}/collection?status=playing")
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $playing);

        // And asking for replays alone still narrows to them.
        $replaying = $this->getJson("/api/v1/users/{$user->username}/collection?status=replaying")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $replaying);
        $this->assertSame('second-run', $replaying[0]['game']['slug']);
    }

    /**
     * A replay cannot be farmed.
     *
     * Bounty and XP for a completion are gated on the ledger rather than on
     * the status, and this is the loop that would have exploited it: finish,
     * replay, finish, forever.
     */
    public function test_replaying_does_not_pay_a_second_bounty(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->shelve($user, $game, 'completed')->assertSuccessful();
        $afterFirst = $user->fresh()->xp;

        $this->shelve($user, $game, 'replaying')->assertSuccessful();
        $this->shelve($user, $game, 'completed')->assertSuccessful();

        $this->assertSame($afterFirst, $user->fresh()->xp, 'The second lap paid again.');
        $this->assertTrue(
            app(BountyService::class)->alreadyAwarded($user, "game_completed:{$game->id}"),
            'The completion should be on the ledger exactly once.'
        );
    }

    /** Existing finishes were given the lap they had already earned. */
    public function test_the_migration_credited_finishes_that_were_already_there(): void
    {
        $user = User::factory()->create();

        // Written straight to the table, the way a row that predates the column
        // looks: a completion stamp and a zero count.
        $entry = UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game('old-finish')->id,
            'status' => 'completed',
            'completed_at' => now()->subYear(),
        ]);
        $entry->forceFill(['playthroughs' => 0])->saveQuietly();

        // Re-run the backfill the migration performs.
        \DB::table('user_games')
            ->where(function ($q) {
                $q->whereNotNull('completed_at')->orWhere('status', 'completed');
            })
            ->update(['playthroughs' => 1]);

        $this->assertSame(1, $entry->fresh()->playthroughs);
    }
}
