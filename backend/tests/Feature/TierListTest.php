<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A tier list answers a different question from a ranking.
 *
 * "Which is first" has one answer per position; "which of these are the same"
 * needs a rung four games can share and still be equally good. So the board is
 * grouped by tier and ordered inside it, and an item with no tier is not
 * missing a value — it is sitting in the unranked tray waiting to be placed.
 */
class TierListTest extends TestCase
{
    use RefreshDatabase;

    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        $this->author = User::factory()->create(['username' => 'ranker']);
    }

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2020-03-01',
            'genres' => ['Action'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function board(string $type = 'tier'): GameList
    {
        return GameList::create([
            'user_id' => $this->author->id,
            'name' => 'Souls games ranked',
            'slug' => 'souls-games-ranked',
            'list_type' => $type,
            'is_public' => true,
        ]);
    }

    private function place(GameList $list, string $slug, ?string $tier, int $position = 0): GameListItem
    {
        return GameListItem::create([
            'game_list_id' => $list->id,
            'game_id' => $this->game($slug)->id,
            'position' => $position,
            'tier' => $tier,
        ]);
    }

    public function test_a_tier_list_is_a_type_a_list_can_be(): void
    {
        $this->actingAs($this->author)
            ->postJson('/api/v1/game-lists', [
                'name' => 'Every Zelda, ranked',
                'list_type' => 'tier',
            ])
            ->assertCreated()
            ->assertJsonPath('data.list_type', 'tier');
    }

    public function test_a_game_can_be_put_on_a_rung(): void
    {
        $list = $this->board();
        $item = $this->place($list, 'elden-ring', null);

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", ['tier' => 'S'])
            ->assertOk();

        $this->assertSame('S', $item->fresh()->tier);
    }

    public function test_several_games_share_a_rung_and_keep_their_order_in_it(): void
    {
        $list = $this->board();
        $first = $this->place($list, 'dark-souls', 'S', 0);
        $second = $this->place($list, 'bloodborne', null);

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/items/{$second->id}", ['tier' => 'S'])
            ->assertOk();

        // Landing on a rung means landing at its end, not on top of whoever is
        // already standing there.
        $this->assertSame('S', $second->fresh()->tier);
        $this->assertGreaterThan($first->position, $second->fresh()->position);
    }

    public function test_clearing_the_tier_returns_a_game_to_the_tray(): void
    {
        $list = $this->board();
        $item = $this->place($list, 'sekiro', 'B');

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", ['tier' => null])
            ->assertOk();

        $this->assertNull($item->fresh()->tier);
    }

    public function test_a_rung_outside_the_scale_is_refused(): void
    {
        $list = $this->board();
        $item = $this->place($list, 'demons-souls', null);

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", ['tier' => 'Z'])
            ->assertStatus(422);

        $this->assertNull($item->fresh()->tier);
    }

    public function test_a_ranking_has_no_tiers_to_set(): void
    {
        $list = $this->board('top10');
        $item = $this->place($list, 'hollow-knight', null);

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", ['tier' => 'S'])
            ->assertStatus(422);

        $this->assertNull($item->fresh()->tier);
    }

    public function test_reordering_one_rung_moves_the_games_into_it(): void
    {
        $list = $this->board();
        $a = $this->place($list, 'game-a', null);
        $b = $this->place($list, 'game-b', 'A');

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/reorder", [
                'tier' => 'A',
                'item_ids' => [$b->id, $a->id],
            ])
            ->assertOk();

        $this->assertSame('A', $a->fresh()->tier);
        $this->assertSame(0, $b->fresh()->position);
        $this->assertSame(1, $a->fresh()->position);
    }

    public function test_a_reorder_without_a_tier_leaves_the_rungs_alone(): void
    {
        $list = $this->board();
        $a = $this->place($list, 'stays-s', 'S');
        $b = $this->place($list, 'stays-d', 'D');

        $this->actingAs($this->author)
            ->putJson("/api/v1/game-lists/{$list->id}/reorder", ['item_ids' => [$b->id, $a->id]])
            ->assertOk();

        // Every other list type reorders this way, and none of them should have
        // its tiers wiped by a plain drag.
        $this->assertSame('S', $a->fresh()->tier);
        $this->assertSame('D', $b->fresh()->tier);
    }

    public function test_the_board_travels_with_each_item(): void
    {
        $list = $this->board();
        $this->place($list, 'on-the-board', 'S');
        $this->place($list, 'in-the-tray', null);

        $items = $this->getJson("/api/v1/users/{$this->author->username}/lists/{$list->slug}")
            ->assertOk()
            ->json('data.items');

        $tiers = array_column($items, 'tier');
        $this->assertContains('S', $tiers);
        $this->assertContains(null, $tiers);
    }
}
