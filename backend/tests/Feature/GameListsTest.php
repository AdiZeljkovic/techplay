<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GameListsTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create(['slug' => $slug, 'name' => ucfirst($slug), 'rating' => 4]);
    }

    private function list(User $user, array $attrs = []): GameList
    {
        return GameList::create(array_merge([
            'user_id' => $user->id,
            'name' => 'My List',
            'slug' => 'my-list',
            'is_public' => true,
        ], $attrs));
    }

    public function test_a_list_carries_its_type_settings_and_tags(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/game-lists', [
            'name' => 'Best RPGs of All Time',
            'description' => 'A personal ranking.',
            'list_type' => 'top10',
            'category' => 'RPG',
            'tags' => ['rpg', 'story'],
            'has_spoilers' => true,
            'allow_comments' => false,
        ])->assertStatus(201);

        $response->assertJsonPath('data.list_type', 'top10')
            ->assertJsonPath('data.item_limit', 10)
            ->assertJsonPath('data.category', 'RPG')
            ->assertJsonPath('data.has_spoilers', true)
            ->assertJsonPath('data.allow_comments', false);

        $this->assertSame(['rpg', 'story'], $response->json('data.tags'));
    }

    public function test_more_than_five_tags_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/game-lists', [
            'name' => 'Overtagged',
            'tags' => ['a', 'b', 'c', 'd', 'e', 'f'],
        ])->assertStatus(422);
    }

    /** A Top 10 that holds eleven is not a Top 10. */
    public function test_a_typed_list_refuses_to_exceed_its_size(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $list = $this->list($user, ['list_type' => 'top10']);

        foreach (range(1, 10) as $i) {
            $this->game("game-{$i}");
            $this->postJson("/api/v1/game-lists/{$list->id}/items", ['slug' => "game-{$i}"])->assertStatus(200);
        }

        $this->game('one-too-many');
        $this->postJson("/api/v1/game-lists/{$list->id}/items", ['slug' => 'one-too-many'])
            ->assertStatus(422);

        $this->assertSame(10, GameListItem::where('game_list_id', $list->id)->count());
    }

    public function test_an_item_carries_a_note_and_a_score(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $list = $this->list($user);
        $game = $this->game('elden-ring');
        $item = GameListItem::create(['game_list_id' => $list->id, 'game_id' => $game->id, 'position' => 0]);

        $this->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", [
            'note' => 'Why this game ranks first.',
            'score' => 9.8,
        ])->assertStatus(200);

        $items = $this->getJson("/api/v1/game-lists/{$list->id}")->json('data.items');

        $this->assertSame('Why this game ranks first.', $items[0]['note']);
        $this->assertSame(9.8, $items[0]['score']);
    }

    public function test_a_score_outside_one_to_ten_is_rejected(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $list = $this->list($user);
        $game = $this->game('overrated');
        $item = GameListItem::create(['game_list_id' => $list->id, 'game_id' => $game->id, 'position' => 0]);

        $this->putJson("/api/v1/game-lists/{$list->id}/items/{$item->id}", ['score' => 11])
            ->assertStatus(422);
    }

    /** Publishing is a deliberate act — a draft is nobody else's business. */
    public function test_a_draft_is_hidden_from_everyone_but_its_author(): void
    {
        $author = User::factory()->create(['username' => 'writer']);
        $list = $this->list($author, ['is_draft' => true]);

        $this->getJson("/api/v1/game-lists/{$list->id}")->assertStatus(403);
        $this->getJson('/api/v1/users/writer/lists')->assertStatus(200)->assertJsonCount(0, 'data');

        Sanctum::actingAs($author);
        $this->getJson("/api/v1/game-lists/{$list->id}")->assertStatus(200);
    }

    public function test_liking_toggles_and_counts(): void
    {
        $author = User::factory()->create();
        $fan = User::factory()->create();
        $list = $this->list($author);

        Sanctum::actingAs($fan);

        $this->postJson("/api/v1/game-lists/{$list->id}/like")
            ->assertStatus(200)
            ->assertJsonPath('data.liked', true)
            ->assertJsonPath('data.likes_count', 1);

        $this->postJson("/api/v1/game-lists/{$list->id}/like")
            ->assertStatus(200)
            ->assertJsonPath('data.liked', false)
            ->assertJsonPath('data.likes_count', 0);
    }

    public function test_comments_respect_the_authors_switch(): void
    {
        $author = User::factory()->create();
        $reader = User::factory()->create();
        $open = $this->list($author, ['slug' => 'open']);
        $closed = $this->list($author, ['slug' => 'closed', 'allow_comments' => false]);

        Sanctum::actingAs($reader);

        $this->postJson("/api/v1/game-lists/{$open->id}/comments", ['body' => 'Great picks.'])
            ->assertStatus(201);

        $this->postJson("/api/v1/game-lists/{$closed->id}/comments", ['body' => 'Not allowed.'])
            ->assertStatus(403);

        $this->getJson("/api/v1/game-lists/{$open->id}/comments")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_a_list_owner_can_delete_any_comment_on_it(): void
    {
        $author = User::factory()->create();
        $reader = User::factory()->create();
        $list = $this->list($author);

        Sanctum::actingAs($reader);
        $id = $this->postJson("/api/v1/game-lists/{$list->id}/comments", ['body' => 'Hello.'])->json('data.id');

        Sanctum::actingAs($author);
        $this->deleteJson("/api/v1/game-lists/{$list->id}/comments/{$id}")->assertStatus(200);
    }

    public function test_discover_ranks_by_likes_and_skips_empty_or_private_lists(): void
    {
        $author = User::factory()->create();
        $fan = User::factory()->create();

        $popular = $this->list($author, ['name' => 'Popular', 'slug' => 'popular']);
        $quiet = $this->list($author, ['name' => 'Quiet', 'slug' => 'quiet']);
        $this->list($author, ['name' => 'Empty', 'slug' => 'empty']);
        $this->list($author, ['name' => 'Private', 'slug' => 'private', 'is_public' => false]);

        foreach ([$popular, $quiet] as $l) {
            $game = $this->game("g-{$l->slug}");
            GameListItem::create(['game_list_id' => $l->id, 'game_id' => $game->id, 'position' => 0]);
        }

        Sanctum::actingAs($fan);
        $this->postJson("/api/v1/game-lists/{$popular->id}/like");

        $names = array_column($this->getJson('/api/v1/game-lists/discover')->json('data'), 'name');

        $this->assertSame(['Popular', 'Quiet'], $names);
    }
}
