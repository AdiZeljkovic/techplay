<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\PlaySession;
use App\Models\SessionSuggestion;
use App\Models\User;
use App\Models\UserGame;
use App\Services\SessionSuggestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SessionSuggestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function shelf(User $user, ?int $seen = null): UserGame
    {
        $game = Game::create(['slug' => 'hades', 'name' => 'Hades', 'released' => '2020-09-17', 'genres' => ['Action'], 'tags' => []]);

        return UserGame::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'playing',
            'playtime_minutes' => $seen ?? 0,
            'playtime_seen_minutes' => $seen,
        ]);
    }

    public function test_the_first_reading_is_a_baseline_not_a_session(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, null);

        // A freshly connected account reports a lifetime total. Offering "you
        // played for 300 hours yesterday" would be worse than offering nothing.
        app(SessionSuggestionService::class)->noticeSteamPlaytime($entry, 18_000);

        $this->assertDatabaseCount('session_suggestions', 0);
        $this->assertSame(18_000, $entry->fresh()->playtime_seen_minutes);
    }

    public function test_a_gain_between_readings_becomes_a_suggestion(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, 600);

        app(SessionSuggestionService::class)->noticeSteamPlaytime($entry, 744);

        $suggestion = SessionSuggestion::first();
        $this->assertNotNull($suggestion);
        $this->assertSame(144, $suggestion->minutes);
        $this->assertSame('pending', $suggestion->status);
    }

    public function test_it_ignores_a_launch_that_never_became_a_session(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, 600);

        // Steam counts getting as far as the main menu.
        app(SessionSuggestionService::class)->noticeSteamPlaytime($entry, 608);

        $this->assertDatabaseCount('session_suggestions', 0);
    }

    public function test_bursts_across_one_day_top_up_a_single_suggestion(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, 600);
        $service = app(SessionSuggestionService::class);

        $service->noticeSteamPlaytime($entry, 660);
        $entry->forceFill(['playtime_seen_minutes' => 660])->save();
        $service->noticeSteamPlaytime($entry->fresh(), 720);

        $this->assertDatabaseCount('session_suggestions', 1);
        $this->assertSame(120, SessionSuggestion::first()->minutes);
    }

    public function test_a_dismissed_game_is_not_proposed_again_the_same_day(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, 600);
        $service = app(SessionSuggestionService::class);

        $service->noticeSteamPlaytime($entry, 700);
        SessionSuggestion::first()->update(['status' => 'dismissed']);

        $entry->forceFill(['playtime_seen_minutes' => 700])->save();
        $service->noticeSteamPlaytime($entry->fresh(), 800);

        $this->assertDatabaseCount('session_suggestions', 1);
        $this->assertSame('dismissed', SessionSuggestion::first()->status);
    }

    public function test_accepting_writes_a_real_session_and_keeps_the_reader_correction(): void
    {
        $user = User::factory()->create();
        $entry = $this->shelf($user, 600);
        app(SessionSuggestionService::class)->noticeSteamPlaytime($entry, 744);

        $suggestion = SessionSuggestion::first();

        // Steam counted the pause menu; the reader knows it was ninety minutes.
        $this->actingAs($user)
            ->postJson("/api/v1/journal/suggestions/{$suggestion->id}", ['minutes' => 90])
            ->assertOk();

        $session = PlaySession::first();
        $this->assertNotNull($session);
        $this->assertSame(90, $session->minutes);
        $this->assertSame('accepted', $suggestion->fresh()->status);
    }

    public function test_it_cannot_be_answered_twice_or_by_somebody_else(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $entry = $this->shelf($owner, 600);
        app(SessionSuggestionService::class)->noticeSteamPlaytime($entry, 744);

        $suggestion = SessionSuggestion::first();

        $this->actingAs($stranger)
            ->postJson("/api/v1/journal/suggestions/{$suggestion->id}")
            ->assertStatus(403);

        $this->actingAs($owner)->postJson("/api/v1/journal/suggestions/{$suggestion->id}")->assertOk();
        $this->actingAs($owner)->postJson("/api/v1/journal/suggestions/{$suggestion->id}")->assertStatus(409);

        $this->assertSame(1, PlaySession::count());
    }
}
