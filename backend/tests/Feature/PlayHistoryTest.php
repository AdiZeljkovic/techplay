<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\JournalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The years behind a player, assembled from dates that exist.
 *
 * Three sources carry a real timestamp: when a game was last opened, when an
 * achievement was unlocked, and when something was finished. None of them is a
 * logged session, which is the point — a reader who imported a library and has
 * never written a diary entry still has a history.
 */
class PlayHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2015-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, string $slug, string $lastPlayed, int $hours, array $extra = []): UserGame
    {
        return UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game($slug)->id,
            'status' => 'played',
            'hours_played' => $hours,
            'playtime_minutes' => $hours * 60,
            'last_played_at' => $lastPlayed,
        ] + $extra);
    }

    private function unlock(User $user, int $gameId, string $at): void
    {
        DB::table('steam_achievements')->insert([
            'user_id' => $user->id,
            'game_id' => $gameId,
            'steam_appid' => 1,
            'api_name' => 'ach_'.uniqid(),
            'achieved' => true,
            'achieved_at' => $at,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_years_are_listed_newest_first_across_every_source(): void
    {
        $user = User::factory()->create();

        $a = $this->shelve($user, 'valheim', '2021-06-01 12:00:00', 500);
        $this->shelve($user, 'hades', '2023-02-14 20:00:00', 40);
        $this->unlock($user, $a->game_id, '2019-03-03 10:00:00');

        $history = (new JournalService)->history($user);

        $this->assertSame([2023, 2021, 2019], array_column($history['years'], 'year'));
        $this->assertSame(['from' => 2019, 'to' => 2023], $history['span']);
    }

    public function test_a_year_counts_the_games_left_off_in_it(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'one', '2022-01-01 10:00:00', 10);
        $this->shelve($user, 'two', '2022-08-01 10:00:00', 20);
        $this->shelve($user, 'three', '2023-01-01 10:00:00', 5);

        $years = collect((new JournalService)->history($user)['years'])->keyBy('year');

        $this->assertSame(2, $years[2022]['games_left_off']);
        $this->assertSame(1, $years[2023]['games_left_off']);
    }

    /**
     * The distinction the whole design rests on.
     *
     * `hours_held` is the total those games carry, not hours played that year —
     * a claim nothing can support, because Steam reports one lifetime figure
     * per game and never says when any of it happened.
     */
    public function test_hours_are_reported_as_held_by_the_games_not_spent_in_the_year(): void
    {
        $user = User::factory()->create();

        // An MMO played across five years and last opened in 2024.
        $this->shelve($user, 'lotro', '2024-05-05 10:00:00', 1602);
        $this->shelve($user, 'soulmask', '2024-06-06 10:00:00', 7);

        $year = collect((new JournalService)->history($user)['years'])->firstWhere('year', 2024);

        $this->assertSame(1609, $year['hours_held']);
        $this->assertSame(2, $year['games_left_off']);
        // And no key claims those hours happened in 2024.
        $this->assertArrayNotHasKey('hours_played', $year);
    }

    public function test_unlocks_are_counted_per_year_with_the_games_they_came_from(): void
    {
        $user = User::factory()->create();

        $a = $this->shelve($user, 'game-a', '2022-01-01 10:00:00', 10);
        $b = $this->shelve($user, 'game-b', '2022-01-01 10:00:00', 10);

        $this->unlock($user, $a->game_id, '2022-03-01 10:00:00');
        $this->unlock($user, $a->game_id, '2022-04-01 10:00:00');
        $this->unlock($user, $b->game_id, '2022-05-01 10:00:00');

        $year = collect((new JournalService)->history($user)['years'])->firstWhere('year', 2022);

        $this->assertSame(3, $year['unlocks']);
        $this->assertSame(2, $year['unlock_games']);
    }

    public function test_a_finish_lands_in_the_year_it_happened(): void
    {
        $user = User::factory()->create();

        $entry = $this->shelve($user, 'scorn', '2026-01-01 10:00:00', 16);
        $entry->update(['status' => 'completed', 'completed_at' => '2025-11-02 18:00:00']);

        $years = collect((new JournalService)->history($user)['years'])->keyBy('year');

        $this->assertCount(1, $years[2025]['finished']);
        $this->assertSame('scorn', $years[2025]['finished'][0]['slug']);
        // Last opened in 2026, finished in 2025 — two different facts.
        $this->assertSame(1, $years[2026]['games_left_off']);
    }

    /**
     * Steam only began attributing playtime to a device partway through, so the
     * split covers less than the total — and the payload says so rather than
     * letting the gap read as missing games.
     */
    public function test_the_device_split_reports_how_much_of_the_total_it_covers(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'newer', '2024-01-01 10:00:00', 100, [
            'device_playtime' => ['windows' => 5400, 'deck' => 600],
        ]);
        // Hours from before Steam recorded a device.
        $this->shelve($user, 'older', '2016-01-01 10:00:00', 200);

        $devices = (new JournalService)->history($user)['devices'];

        $this->assertSame(5400, $devices['minutes']['windows']);
        $this->assertSame(600, $devices['minutes']['deck']);
        $this->assertSame(100, $devices['attributed_hours']);
        $this->assertSame(300, $devices['total_hours'], 'The gap is the point: it is stated, not hidden.');
    }

    public function test_a_shelf_with_no_dates_has_no_history_rather_than_an_empty_year(): void
    {
        $user = User::factory()->create();

        UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game('never-opened')->id,
            'status' => 'backlog',
        ]);

        $history = (new JournalService)->history($user);

        $this->assertSame([], $history['years']);
        $this->assertNull($history['span']);
    }
}
