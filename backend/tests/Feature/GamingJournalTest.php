<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\PlaySession;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GamingJournalTest extends TestCase
{
    use RefreshDatabase;

    private function game(array $attrs = []): Game
    {
        static $n = 0;
        $n++;

        return Game::create(array_merge([
            'slug' => 'journal-game-'.$n,
            'name' => 'Journal Game '.$n,
            'released' => '2020-01-01',
        ], $attrs));
    }

    private function log(User $user, Game $game, array $payload = []): int
    {
        return $this->actingAs($user)
            ->postJson('/api/v1/journal/sessions', array_merge([
                'game_slug' => $game->slug,
                'played_on' => now()->toDateString(),
                'minutes' => 90,
            ], $payload))
            ->assertOk()
            ->json('data.id');
    }

    public function test_a_session_records_everything_the_player_typed(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();

        $this->log($user, $game, [
            'platform' => 'PC',
            'progress_label' => 'Stormveil Castle',
            'progress_percent' => 35,
            'note' => 'Went badly.',
            'mood' => 'frustrated',
            'companions' => ['mika', 'the cousin'],
            'has_spoilers' => true,
        ]);

        $session = $this->getJson('/api/v1/users/adi/journal')->assertOk()->json('data.sessions.0');

        $this->assertSame(90, $session['minutes']);
        $this->assertSame('Stormveil Castle', $session['progress_label']);
        $this->assertSame(35, $session['progress_percent']);
        $this->assertSame('frustrated', $session['mood']);
        $this->assertSame(['mika', 'the cousin'], $session['companions']);
        $this->assertTrue($session['has_spoilers']);
        $this->assertSame($game->slug, $session['game']['slug']);
    }

    public function test_logged_minutes_become_the_collection_entrys_playtime(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        $this->log($user, $game, ['minutes' => 120]);
        $this->log($user, $game, ['minutes' => 60]);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertSame(180, (int) $entry->playtime_minutes);
        $this->assertSame(3, (int) $entry->hours_played);
        $this->assertSame('journal', $entry->playtime_source);
    }

    public function test_the_journal_never_overwrites_a_steam_playtime(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing',
            'playtime_minutes' => 5000, 'playtime_source' => 'steam',
        ]);

        $this->log($user, $game, ['minutes' => 30]);

        $entry = UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first();

        $this->assertSame(5000, (int) $entry->playtime_minutes, 'Steam reads the real client and stays authoritative');
        $this->assertSame('steam', $entry->playtime_source);
    }

    public function test_deleting_a_session_recomputes_the_total(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => 'playing']);

        $first = $this->log($user, $game, ['minutes' => 100]);
        $this->log($user, $game, ['minutes' => 50]);

        $this->actingAs($user)->deleteJson("/api/v1/journal/sessions/{$first}")->assertOk();

        $this->assertSame(50, (int) UserGame::where('user_id', $user->id)->where('game_id', $game->id)->first()->playtime_minutes);
    }

    public function test_the_summary_and_calendar_are_derived_from_the_whole_history(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $a = $this->game();
        $b = $this->game();

        $this->log($user, $a, ['minutes' => 120, 'played_on' => now()->toDateString()]);
        $this->log($user, $a, ['minutes' => 60, 'played_on' => now()->toDateString()]);
        $this->log($user, $b, ['minutes' => 30, 'played_on' => now()->subDay()->toDateString()]);

        $data = $this->getJson('/api/v1/users/adi/journal')->assertOk()->json('data');

        $this->assertSame(3, $data['summary']['sessions']);
        $this->assertSame(210, $data['summary']['minutes']);
        $this->assertSame(2, $data['summary']['games']);
        $this->assertSame(2, $data['summary']['days']);
        $this->assertSame(2, $data['summary']['current_streak']);

        // Two days on the calendar, the busier one carrying both sessions.
        $this->assertCount(2, $data['calendar']);
        $today = collect($data['calendar'])->firstWhere('date', now()->toDateString());
        $this->assertSame(180, $today['minutes']);
        $this->assertSame(2, $today['sessions']);

        $this->assertSame(180, $data['per_game'][0]['minutes']);
        $this->assertSame(86, $data['per_game'][0]['percent']);
    }

    public function test_a_broken_streak_reads_as_zero(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();

        PlaySession::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'played_on' => now()->subDays(6)->toDateString(), 'minutes' => 60,
        ]);

        $this->assertSame(0, $this->getJson('/api/v1/users/adi/journal')->assertOk()->json('data.summary.current_streak'));
    }

    public function test_private_sessions_are_withheld_from_visitors_but_not_from_the_owner(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $game = $this->game();

        $this->log($user, $game, ['minutes' => 60, 'is_private' => true]);
        $this->log($user, $game, ['minutes' => 30]);

        // actingAs sticks for the rest of the test — drop the guard so the
        // next call is genuinely a visitor.
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/users/adi/journal')->assertOk()->assertJsonCount(1, 'data.sessions');
        $this->actingAs($user)->getJson('/api/v1/users/adi/journal')->assertOk()->assertJsonCount(2, 'data.sessions');
    }

    public function test_a_stranger_cannot_edit_someone_elses_session(): void
    {
        $owner = User::factory()->create(['username' => 'adi']);
        $stranger = User::factory()->create();
        $id = $this->log($owner, $this->game());

        $this->actingAs($stranger)->putJson("/api/v1/journal/sessions/{$id}", ['minutes' => 999])->assertStatus(403);
        $this->actingAs($stranger)->deleteJson("/api/v1/journal/sessions/{$id}")->assertStatus(403);
    }

    public function test_a_screenshot_is_stored_and_a_clip_is_linked(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['username' => 'adi']);
        $id = $this->log($user, $this->game());

        $this->actingAs($user)->postJson("/api/v1/journal/sessions/{$id}/moments", [
            'type' => 'clip',
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'caption' => 'The run that worked',
        ])->assertOk()->assertJsonPath('data.provider', 'youtube')
            ->assertJsonPath('data.thumbnail_url', 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');

        $shot = $this->actingAs($user)->post("/api/v1/journal/sessions/{$id}/moments", [
            'type' => 'screenshot',
            'image' => UploadedFile::fake()->create('shot.jpg', 120, 'image/jpeg'),
        ])->assertOk()->json('data');

        $this->assertNotNull($shot['path']);
        Storage::disk('public')->assertExists($shot['path']);
    }

    public function test_clips_from_hosts_we_cannot_render_are_refused(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $id = $this->log($user, $this->game());

        $this->actingAs($user)->postJson("/api/v1/journal/sessions/{$id}/moments", [
            'type' => 'clip',
            'url' => 'https://example.com/my-video.mp4',
        ])->assertStatus(422);
    }

    public function test_a_session_holds_at_most_four_moments(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['username' => 'adi']);
        $id = $this->log($user, $this->game());

        foreach (range(1, 4) as $_) {
            $this->actingAs($user)->post("/api/v1/journal/sessions/{$id}/moments", [
                'type' => 'screenshot',
                'image' => UploadedFile::fake()->create('shot.jpg', 120, 'image/jpeg'),
            ])->assertOk();
        }

        $this->actingAs($user)->post("/api/v1/journal/sessions/{$id}/moments", [
            'type' => 'screenshot',
            'image' => UploadedFile::fake()->create('one-too-many.jpg', 120, 'image/jpeg'),
        ])->assertStatus(422);
    }

    public function test_deleting_a_session_takes_its_stored_screenshots_with_it(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['username' => 'adi']);
        $id = $this->log($user, $this->game());

        $path = $this->actingAs($user)->post("/api/v1/journal/sessions/{$id}/moments", [
            'type' => 'screenshot',
            'image' => UploadedFile::fake()->create('shot.jpg', 120, 'image/jpeg'),
        ])->assertOk()->json('data.path');

        $this->actingAs($user)->deleteJson("/api/v1/journal/sessions/{$id}")->assertOk();

        Storage::disk('public')->assertMissing($path);
    }

    public function test_a_private_profile_keeps_its_journal_closed(): void
    {
        $user = User::factory()->create([
            'username' => 'adi',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        $this->getJson('/api/v1/users/adi/journal')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/v1/users/adi/journal')->assertOk();
    }

    public function test_sessions_cannot_be_logged_in_the_future_or_run_longer_than_a_day(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->actingAs($user)->postJson('/api/v1/journal/sessions', [
            'game_slug' => $game->slug,
            'played_on' => now()->addWeek()->toDateString(),
            'minutes' => 60,
        ])->assertStatus(422);

        $this->actingAs($user)->postJson('/api/v1/journal/sessions', [
            'game_slug' => $game->slug,
            'played_on' => now()->toDateString(),
            'minutes' => 2000,
        ])->assertStatus(422);
    }
}
