<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\PresenceService;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Continue playing" should be about now.
 *
 * It read only `status = 'playing'` — a shelf state somebody sets once and
 * rarely returns to correct. On the account that surfaced this it had sat four
 * days stale, naming two games while a third was actually running and Steam
 * was reporting it by name the whole time.
 */
class ContinuePlayingTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $name, string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => $name,
            'released' => '2015-01-01',
            'genres' => ['Shooter'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, Game $game, string $status = 'playing'): void
    {
        UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => $status]);
    }

    private function playingNow(User $user): array
    {
        return app(ProfileService::class)->playingNow($user, 8);
    }

    public function test_the_live_game_leads_even_when_it_is_not_on_the_shelf(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, $this->game('Fable: Anniversary', 'fable-anniversary'));

        $metro = $this->game('Metro: Last Light', 'metro-last-light');
        app(PresenceService::class)->set($user, 'Metro: Last Light Complete Edition', 'steam');

        $rows = $this->playingNow($user);

        $this->assertSame($metro->slug, $rows[0]['slug']);
        $this->assertTrue($rows[0]['live']);
        // The shelf is not thrown away — it follows.
        $this->assertSame('fable-anniversary', $rows[1]['slug']);
    }

    public function test_the_library_is_not_rewritten_behind_the_member(): void
    {
        $user = User::factory()->create();
        $metro = $this->game('Metro: Last Light', 'metro-last-light');

        app(PresenceService::class)->set($user, 'Metro: Last Light Complete Edition', 'steam');
        $this->playingNow($user);

        // Presence is a fact about right now. Quietly adding a game somebody
        // does not own to their library is not a thing to do for them.
        $this->assertSame(0, UserGame::where('user_id', $user->id)->count());
    }

    public function test_a_game_on_both_is_listed_once_and_marked_live(): void
    {
        $user = User::factory()->create();
        $metro = $this->game('Metro: Last Light', 'metro-last-light');
        $this->shelve($user, $metro);

        app(PresenceService::class)->set($user, 'Metro: Last Light Complete Edition', 'steam');

        $rows = $this->playingNow($user);

        $this->assertCount(1, $rows);
        $this->assertTrue($rows[0]['live']);
        // Promoted, not duplicated — and it keeps the shelf's own figures.
        $this->assertArrayHasKey('hours_played', $rows[0]);
    }

    public function test_without_a_presence_the_shelf_answers_as_it_always_did(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, $this->game('Fable: Anniversary', 'fable-anniversary'));

        $rows = $this->playingNow($user);

        $this->assertCount(1, $rows);
        $this->assertSame('fable-anniversary', $rows[0]['slug']);
    }

    public function test_a_presence_the_catalogue_cannot_place_changes_nothing(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, $this->game('Fable: Anniversary', 'fable-anniversary'));

        app(PresenceService::class)->set($user, 'Some Unlisted Indie', 'steam');

        $rows = $this->playingNow($user);

        $this->assertCount(1, $rows);
        $this->assertSame('fable-anniversary', $rows[0]['slug']);
    }
}
