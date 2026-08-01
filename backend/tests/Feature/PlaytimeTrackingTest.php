<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserGame;
use App\Services\PresenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlaytimeTrackingTest extends TestCase
{
    use RefreshDatabase;

    private function service(): PresenceService
    {
        return app(PresenceService::class);
    }

    private function startedMinutesAgo(User $user, Game $game, int $minutes, string $source = 'discord'): Presence
    {
        // presences.user_id is unique — one live session per user
        return Presence::updateOrCreate(
            ['user_id' => $user->id],
            [
                'game_id' => $game->id,
                'game_name' => $game->name,
                'game_slug' => $game->slug,
                'source' => $source,
                'is_active' => true,
                'started_at' => now()->subMinutes($minutes),
            ]
        );
    }

    public function test_a_finished_session_is_banked_against_the_library_entry(): void
    {
        $user = User::factory()->create(['username' => 'player']);
        $game = Game::create(['slug' => 'long-night', 'name' => 'Long Night', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        $this->startedMinutesAgo($user, $game, 95);
        $this->service()->clear($user);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();
        $this->assertSame(95, $entry->playtime_minutes);
        $this->assertSame(1, $entry->hours_played); // 95 min → 1 whole hour
        $this->assertSame('discord', $entry->playtime_source);
    }

    public function test_sessions_accumulate_across_sittings(): void
    {
        $user = User::factory()->create(['username' => 'grinder2']);
        $game = Game::create(['slug' => 'daily-game', 'name' => 'Daily Game', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        foreach ([40, 40] as $minutes) {
            $this->startedMinutesAgo($user, $game, $minutes);
            $this->service()->clear($user);
        }

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();
        $this->assertSame(80, $entry->playtime_minutes);
        $this->assertSame(1, $entry->hours_played);
    }

    /** A machine left running overnight is not a 30-hour sitting. */
    public function test_absurdly_long_sessions_are_discarded(): void
    {
        $user = User::factory()->create(['username' => 'afk']);
        $game = Game::create(['slug' => 'idle-game', 'name' => 'Idle Game', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        $this->startedMinutesAgo($user, $game, 30 * 60);
        $this->service()->clear($user);

        $this->assertSame(0, UserGame::where('user_id', $user->id)->value('playtime_minutes'));
    }

    public function test_presence_flickers_are_ignored(): void
    {
        $user = User::factory()->create(['username' => 'flicker']);
        $game = Game::create(['slug' => 'blip', 'name' => 'Blip', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        $this->startedMinutesAgo($user, $game, 1);
        $this->service()->clear($user);

        $this->assertSame(0, UserGame::where('user_id', $user->id)->value('playtime_minutes'));
    }

    /** Steam reports lifetime playtime; sessions must not add on top of it. */
    public function test_steam_owned_entries_are_never_touched_by_sessions(): void
    {
        $user = User::factory()->create(['username' => 'steamer']);
        $game = Game::create(['slug' => 'steam-game', 'name' => 'Steam Game', 'rating' => 4]);
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing',
            'hours_played' => 120, 'playtime_minutes' => 7200, 'playtime_source' => 'steam',
        ]);

        $this->startedMinutesAgo($user, $game, 60);
        $this->service()->clear($user);

        $entry = UserGame::where('user_id', $user->id)->first();
        $this->assertSame(7200, $entry->playtime_minutes);
        $this->assertSame(120, $entry->hours_played);
        $this->assertSame('steam', $entry->playtime_source);
    }

    /** Presence can name anything; we do not invent library rows from it. */
    public function test_games_outside_the_collection_are_not_credited(): void
    {
        $user = User::factory()->create(['username' => 'stranger2']);
        $game = Game::create(['slug' => 'untracked', 'name' => 'Untracked', 'rating' => 4]);

        $this->startedMinutesAgo($user, $game, 60);
        $this->service()->clear($user);

        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_switching_games_banks_the_previous_session(): void
    {
        $user = User::factory()->create(['username' => 'switcher']);
        $first = Game::create(['slug' => 'game-one', 'name' => 'Game One', 'rating' => 4]);
        $second = Game::create(['slug' => 'game-two', 'name' => 'Game Two', 'rating' => 4]);
        UserGame::create(['user_id' => $user->id, 'game_id' => $first->id, 'status' => 'playing']);
        UserGame::create(['user_id' => $user->id, 'game_id' => $second->id, 'status' => 'playing']);

        $this->startedMinutesAgo($user, $first, 50);
        $this->service()->set($user, 'Game Two', 'discord');

        $this->assertSame(50, UserGame::where('game_id', $first->id)->value('playtime_minutes'));
        $this->assertSame(0, UserGame::where('game_id', $second->id)->value('playtime_minutes'));
    }
}
