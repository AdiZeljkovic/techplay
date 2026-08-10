<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Services\Chronicle\ChronicleBuilder;
use App\Services\Chronicle\TasteProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Mockery;
use Tests\TestCase;

/**
 * P4 unit eight: the chronicle and recommendations.
 *
 * forget() does not clear a cache — it deletes the built row, which the next
 * read has to reconstruct from eleven queries. So *when* it runs matters as
 * much as whether it runs.
 */
class ChronicleTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug = 'elden-ring'): Game
    {
        return Game::create(['slug' => $slug, 'name' => 'Elden Ring', 'released' => '2022-02-25']);
    }

    private function chronicleExists(User $user): bool
    {
        return DB::table('user_chronicles')->where('user_id', $user->id)->exists();
    }

    public function test_a_rejected_request_does_not_throw_away_the_chronicle(): void
    {
        $user = User::factory()->create();

        app(ChronicleBuilder::class)->build($user);
        $this->assertTrue($this->chronicleExists($user));

        // Unknown slug: 404 before anything is written. This used to delete the
        // row anyway, because forget() was the first statement in the method.
        $this->actingAs($user)
            ->putJson('/api/v1/collection/games/a-game-that-does-not-exist', ['status' => 'backlog'])
            ->assertStatus(404);

        $this->assertTrue($this->chronicleExists($user), 'a 404 must not cost a rebuild');

        // Same for a request that fails validation.
        $game = $this->game();
        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'not-a-real-status'])
            ->assertStatus(422);

        $this->assertTrue($this->chronicleExists($user), 'a 422 must not cost a rebuild either');
    }

    public function test_a_real_change_does_invalidate_the_chronicle(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        app(ChronicleBuilder::class)->build($user);
        $this->assertTrue($this->chronicleExists($user));

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'playing'])
            ->assertSuccessful();

        $this->assertFalse($this->chronicleExists($user));
    }

    public function test_removing_a_game_invalidates_it_too(): void
    {
        $user = User::factory()->create();
        $game = $this->game();

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'playing'])
            ->assertSuccessful();

        app(ChronicleBuilder::class)->build($user);
        $this->assertTrue($this->chronicleExists($user));

        // Taking a game off the shelf says as much about taste as adding one.
        $this->actingAs($user)
            ->deleteJson("/api/v1/collection/games/{$game->slug}")
            ->assertSuccessful();

        $this->assertFalse($this->chronicleExists($user));
    }

    public function test_an_unbuildable_chronicle_costs_recommendations_not_the_page(): void
    {
        Cache::flush();

        $user = User::factory()->create();

        // chronicle:rebuild isolates a failing user so one cannot abort the
        // nightly run; the web path had no equivalent and returned a 500.
        $this->mock(ChronicleBuilder::class, function ($mock) {
            $mock->shouldReceive('build')->andThrow(new \RuntimeException('cannot build'));
        });

        $taste = app(TasteProfileService::class);

        $this->assertSame([], $taste->gameAffinities($user));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
