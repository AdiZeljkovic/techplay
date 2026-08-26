<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A tag that leads nowhere is decoration.
 *
 * The field has existed since lists were expanded, and one list of seven
 * bothered to fill it in — because nothing was on the other side of it. A tag
 * with a page behind it is navigation, which is what it does on every site
 * where lists actually work.
 */
class ListTagsTest extends TestCase
{
    use RefreshDatabase;

    private function publishedList(array $tags, string $name = 'Ranked'): GameList
    {
        $user = User::factory()->create(['profile_visibility' => 'public']);

        $list = GameList::create([
            'user_id' => $user->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'is_public' => true,
            'is_draft' => false,
            'tags' => $tags,
        ]);

        $game = Game::create([
            'slug' => 'g-'.uniqid(),
            'name' => 'A Game',
            'released' => '2020-01-01',
            'genres' => ['Horror'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);

        GameListItem::create(['game_list_id' => $list->id, 'game_id' => $game->id, 'position' => 0]);

        return $list;
    }

    public function test_discover_can_be_asked_for_one_tag(): void
    {
        $this->publishedList(['horror'], 'Scary games');
        $this->publishedList(['racing'], 'Fast cars');

        $names = array_column(
            $this->getJson('/api/v1/game-lists/discover?tag=horror')->assertOk()->json('data'),
            'name'
        );

        $this->assertSame(['Scary games'], $names);
    }

    public function test_a_tag_matches_whole_and_not_by_prefix(): void
    {
        $this->publishedList(['rpg'], 'Proper RPGs');
        $this->publishedList(['rpg-likes'], 'Nearly RPGs');

        $names = array_column(
            $this->getJson('/api/v1/game-lists/discover?tag=rpg')->assertOk()->json('data'),
            'name'
        );

        // Anchored on the quoted element, so "rpg" does not drag in
        // "rpg-likes" — the failure a bare LIKE would produce.
        $this->assertSame(['Proper RPGs'], $names);
    }

    public function test_a_tag_nobody_uses_returns_nothing_rather_than_everything(): void
    {
        $this->publishedList(['horror']);

        $this->getJson('/api/v1/game-lists/discover?tag=doesnotexist')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_no_tag_still_returns_the_whole_directory(): void
    {
        $this->publishedList(['horror']);
        $this->publishedList(['racing'], 'Fast cars');

        $this->getJson('/api/v1/game-lists/discover')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_the_tag_index_counts_what_is_in_use(): void
    {
        $this->publishedList(['horror'], 'One');
        $this->publishedList(['horror', 'indie'], 'Two');

        $tags = $this->getJson('/api/v1/game-lists/tags')->assertOk()->json('data');

        $this->assertSame(['tag' => 'horror', 'count' => 2], $tags[0]);
        $this->assertContains(['tag' => 'indie', 'count' => 1], $tags);
    }

    public function test_a_draft_lends_its_tags_to_nobody(): void
    {
        $user = User::factory()->create(['profile_visibility' => 'public']);
        GameList::create([
            'user_id' => $user->id,
            'name' => 'Not yet',
            'slug' => 'not-yet',
            'is_public' => true,
            'is_draft' => true,
            'tags' => ['secret'],
        ]);

        $tags = $this->getJson('/api/v1/game-lists/tags')->assertOk()->json('data');

        $this->assertSame([], $tags);
    }
}
