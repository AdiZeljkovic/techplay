<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\TasteMatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TasteMatchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function game(string $slug, array $genres, array $platforms = ['PC']): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2020-01-01',
            'genres' => $genres,
            'platforms' => $platforms,
            'tags' => [],
        ]);
    }

    private function shelve(User $user, array $games, string $status = 'playing'): void
    {
        foreach ($games as $game) {
            UserGame::create(['user_id' => $user->id, 'game_id' => $game->id, 'status' => $status]);
        }
    }

    public function test_two_people_who_own_nothing_alike_can_still_match_on_taste(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create(['username' => 'other']);

        // No game in common, both entirely RPG.
        $this->shelve($a, [$this->game('a1', ['RPG']), $this->game('a2', ['RPG']), $this->game('a3', ['RPG'])]);
        $this->shelve($b, [$this->game('b1', ['RPG']), $this->game('b2', ['RPG']), $this->game('b3', ['RPG'])]);

        $result = app(TasteMatchService::class)->between($a, $b);

        $this->assertTrue($result['comparable']);
        // Genres carry half the score and platforms a fifth, and both are
        // perfect here — a raw overlap count would have called them strangers.
        $this->assertGreaterThan(60, $result['score']);
        $this->assertSame(0, $result['counts']['shared']);
    }

    public function test_opposite_tastes_score_low(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create(['username' => 'other']);

        $this->shelve($a, [$this->game('a1', ['RPG']), $this->game('a2', ['RPG']), $this->game('a3', ['RPG'])]);
        $this->shelve($b, [
            $this->game('b1', ['Sports'], ['PlayStation']),
            $this->game('b2', ['Sports'], ['PlayStation']),
            $this->game('b3', ['Racing'], ['PlayStation']),
        ]);

        $result = app(TasteMatchService::class)->between($a, $b);

        $this->assertTrue($result['comparable']);
        $this->assertLessThan(15, $result['score']);
        $this->assertSame('Opposites', $result['verdict']);
    }

    public function test_a_shelf_too_small_to_measure_says_so_instead_of_guessing(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create(['username' => 'other']);

        $this->shelve($a, [$this->game('a1', ['RPG'])]);
        $this->shelve($b, [$this->game('b1', ['RPG']), $this->game('b2', ['RPG']), $this->game('b3', ['RPG'])]);

        $result = app(TasteMatchService::class)->between($a, $b);

        // Two people who own one game each are not "50% matched" in any sense
        // worth printing.
        $this->assertFalse($result['comparable']);
        $this->assertSame('too_small', $result['reason']);
        $this->assertTrue($result['yours_is_short']);
    }

    public function test_the_wishlist_is_intent_and_does_not_count_as_taste(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create(['username' => 'other']);

        $this->shelve($a, [$this->game('a1', ['RPG']), $this->game('a2', ['RPG']), $this->game('a3', ['RPG'])]);
        $this->shelve($b, [$this->game('b1', ['RPG']), $this->game('b2', ['RPG']), $this->game('b3', ['RPG'])], 'wishlist');

        $result = app(TasteMatchService::class)->between($a, $b);

        // A wishlist is who somebody would like to be; the shelf is who they are.
        $this->assertFalse($result['comparable']);
    }

    public function test_it_needs_a_viewer_and_respects_a_private_shelf(): void
    {
        $viewer = User::factory()->create();
        $hidden = User::factory()->create(['username' => 'hidden', 'profile_visibility' => 'friends']);

        $this->shelve($viewer, [$this->game('a1', ['RPG']), $this->game('a2', ['RPG']), $this->game('a3', ['RPG'])]);
        $this->shelve($hidden, [$this->game('b1', ['RPG']), $this->game('b2', ['RPG']), $this->game('b3', ['RPG'])]);

        $this->getJson('/api/v1/users/hidden/taste-match')->assertStatus(401);
        $this->actingAs($viewer)->getJson('/api/v1/users/hidden/taste-match')->assertStatus(403);
    }

    public function test_comparing_yourself_is_not_a_comparison(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $this->shelve($user, [$this->game('a1', ['RPG']), $this->game('a2', ['RPG']), $this->game('a3', ['RPG'])]);

        $result = $this->actingAs($user)
            ->getJson('/api/v1/users/adi/taste-match')
            ->assertOk()
            ->json('data');

        $this->assertFalse($result['comparable']);
        $this->assertSame('self', $result['reason']);
    }
}
