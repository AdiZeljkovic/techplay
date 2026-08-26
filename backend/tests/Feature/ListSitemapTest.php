<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The only pages on this site written by its members were the only ones Google
 * was never told about.
 *
 * The sitemap has covered pages, articles, categories, guides, products, news,
 * images, the hub, 332,455 games and every studio since each of those shipped.
 * Lists were absent from all of it — and they were also linked from nowhere in
 * the navigation, so neither a reader nor a crawler had a way in. Two members
 * of fifty-four had ever made one.
 */
class ListSitemapTest extends TestCase
{
    use RefreshDatabase;

    private function listWith(array $attrs, bool $withGame = true): GameList
    {
        $user = User::factory()->create();

        $list = GameList::create(array_merge([
            'user_id' => $user->id,
            'name' => 'Souls games ranked',
            'slug' => 'souls-games-ranked-'.uniqid(),
            'is_public' => true,
            'is_draft' => false,
        ], $attrs, ['user_id' => $user->id]));

        if ($withGame) {
            $game = Game::create([
                'slug' => 'a-game-'.uniqid(),
                'name' => 'A Game',
                'released' => '2021-01-01',
                'genres' => ['RPG'],
                'platforms' => ['PC'],
                'tags' => [],
            ]);

            GameListItem::create(['game_list_id' => $list->id, 'game_id' => $game->id, 'position' => 0]);
        }

        return $list->fresh();
    }

    public function test_a_published_list_is_in_the_sitemap(): void
    {
        $list = $this->listWith([]);

        $this->get('/sitemap-lists.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml')
            ->assertSee("/lists/{$list->user->username}/{$list->slug}", false);
    }

    public function test_a_draft_is_not_offered_to_a_crawler(): void
    {
        // Its public URL answers 404, and a sitemap full of 404s is worse than
        // one that never mentioned them.
        $list = $this->listWith(['is_draft' => true]);

        $this->get('/sitemap-lists.xml')
            ->assertOk()
            ->assertDontSee($list->slug, false);
    }

    public function test_a_private_list_is_not_offered_either(): void
    {
        $list = $this->listWith(['is_public' => false]);

        $this->get('/sitemap-lists.xml')
            ->assertOk()
            ->assertDontSee($list->slug, false);
    }

    public function test_an_empty_list_is_a_page_with_nothing_on_it(): void
    {
        $list = $this->listWith([], withGame: false);

        $this->get('/sitemap-lists.xml')
            ->assertOk()
            ->assertDontSee($list->slug, false);
    }

    public function test_the_index_names_the_list_sitemap_once_there_is_one(): void
    {
        $this->get('/sitemap.xml')->assertOk()->assertDontSee('sitemap-lists.xml', false);

        $this->listWith([]);

        $this->get('/sitemap.xml')->assertOk()->assertSee('sitemap-lists.xml', false);
    }
}
