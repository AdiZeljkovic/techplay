<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserGame;
use App\Services\PresenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A game nobody catalogued used to register as nothing at all.
 *
 * bankSession() writes minutes onto a UserGame row, and a game the member had
 * never added had none — so playing it produced no shelf entry, no playtime,
 * and no record that it happened. Steam and Discord both reported the title
 * by name the whole time.
 *
 * Two minutes is the threshold, the same one that already separates play from
 * a presence flicker, so a launcher opened and shut leaves nothing behind.
 */
class PresenceShelvesGameTest extends TestCase
{
    use RefreshDatabase;

    private function game(): Game
    {
        return Game::create([
            'slug' => 'metro-last-light',
            'name' => 'Metro: Last Light',
            'released' => '2013-05-14',
            'genres' => ['Shooter'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    /** Rewind the running session so it looks as long as the test needs. */
    private function playingFor(User $user, int $minutes): void
    {
        Presence::where('user_id', $user->id)->update(['started_at' => now()->subMinutes($minutes)]);
    }

    public function test_a_real_session_puts_an_uncatalogued_game_on_the_shelf(): void
    {
        $user = User::factory()->create();
        $game = $this->game();
        $service = app(PresenceService::class);

        $service->set($user, 'Metro: Last Light Complete Edition', 'steam');
        $this->playingFor($user, 5);
        $service->set($user, 'Metro: Last Light Complete Edition', 'steam');

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNotNull($entry);
        $this->assertSame('playing', $entry->status);
        // The same ledger a store import writes to, so the shelf can say the
        // site noticed this rather than the member filing it.
        $this->assertContains('steam', $entry->sources ?? []);
    }

    public function test_a_flicker_leaves_nothing_behind(): void
    {
        $user = User::factory()->create();
        $this->game();

        // Launched and shut inside the threshold.
        app(PresenceService::class)->set($user, 'Metro: Last Light', 'steam');

        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_a_shelf_entry_the_member_filed_is_left_as_they_filed_it(): void
    {
        $user = User::factory()->create();
        $game = $this->game();
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'completed']);

        $service = app(PresenceService::class);
        $service->set($user, 'Metro: Last Light', 'steam');
        $this->playingFor($user, 30);
        $service->set($user, 'Metro: Last Light', 'steam');

        // Loading a finished game again does not demote it to `playing`.
        $this->assertSame('completed', UserGame::where('user_id', $user->id)->first()->status);
    }

    public function test_the_switch_is_honoured(): void
    {
        $user = User::factory()->create(['auto_add_played_games' => false]);
        $this->game();

        $service = app(PresenceService::class);
        $service->set($user, 'Metro: Last Light', 'steam');
        $this->playingFor($user, 40);
        $service->set($user, 'Metro: Last Light', 'steam');

        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_ending_a_session_banks_the_time_onto_the_new_row(): void
    {
        $user = User::factory()->create();
        $game = $this->game();
        $service = app(PresenceService::class);

        $service->set($user, 'Metro: Last Light', 'discord');
        $this->playingFor($user, 90);

        // Switching titles closes the session and banks it — the path a source
        // that reports once and goes quiet actually takes.
        $service->set($user, 'Something Else Entirely', 'discord');

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertNotNull($entry);
        $this->assertSame(90, $entry->playtime_minutes);
        $this->assertSame('discord', $entry->playtime_source);
    }
}
