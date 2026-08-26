<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Filling a list without hunting for your own games.
 *
 * Four of the first seven lists on this site were empty. A starter names the
 * list and picks its shape, and then leaves the author in front of a search
 * box — somebody with 280 games in their library should not have to find them
 * again in a catalogue of 332,455.
 *
 * The rule that matters here is partial success: a batch that runs past a Top
 * 10's ceiling adds what fits and says what did not, rather than refusing all
 * ten because the eleventh was one too many.
 */
class ListBulkAddTest extends TestCase
{
    use RefreshDatabase;

    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        $this->author = User::factory()->create(['username' => 'stacker']);
    }

    private function games(int $n): array
    {
        return collect(range(1, $n))->map(fn ($i) => Game::create([
            'slug' => "game-{$i}-".uniqid(),
            'name' => "Game {$i}",
            'released' => '2020-01-01',
            'genres' => ['Action'],
            'platforms' => ['PC'],
            'tags' => [],
        ])->slug)->all();
    }

    private function list(string $type = 'custom'): GameList
    {
        return GameList::create([
            'user_id' => $this->author->id,
            'name' => 'From the shelf',
            'slug' => 'from-the-shelf',
            'list_type' => $type,
            'is_public' => true,
        ]);
    }

    public function test_a_batch_lands_on_the_list(): void
    {
        $list = $this->list();
        $slugs = $this->games(5);

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $slugs])
            ->assertOk()
            ->assertJsonPath('data.items_count', 5);
    }

    public function test_each_game_gets_its_own_place_in_the_order(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $this->games(4)])
            ->assertOk();

        $positions = GameListItem::where('game_list_id', $list->id)->pluck('position')->all();

        // Four games all sitting at position 0 is not an order.
        $this->assertCount(4, array_unique($positions));
    }

    public function test_a_game_already_on_the_list_is_not_added_twice(): void
    {
        $list = $this->list();
        $slugs = $this->games(3);

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $slugs])
            ->assertOk();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $slugs])
            ->assertOk()
            ->assertJsonPath('data.items_count', 3);
    }

    public function test_a_top_ten_takes_what_fits_and_says_what_did_not(): void
    {
        $list = $this->list('top10');

        $response = $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $this->games(14)])
            ->assertOk()
            ->assertJsonPath('data.items_count', 10);

        // Refusing all fourteen because the eleventh was one too many is the
        // behaviour this test exists to prevent.
        $this->assertStringContainsString('4 skipped', $response->json('message'));
    }

    public function test_an_empty_batch_is_refused(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => []])
            ->assertStatus(422);
    }

    public function test_nobody_fills_somebody_elses_list(): void
    {
        $list = $this->list();
        $stranger = User::factory()->create(['username' => 'notyours']);

        $this->actingAs($stranger)
            ->postJson("/api/v1/game-lists/{$list->id}/items/bulk", ['slugs' => $this->games(2)])
            ->assertStatus(404);

        $this->assertSame(0, GameListItem::where('game_list_id', $list->id)->count());
    }
}
