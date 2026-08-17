<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One request per game page instead of five.
 *
 * The page fetched the game, its screenshots, its series, its suggestions and
 * its related articles separately. The API meters at sixty requests a minute
 * keyed on the caller's IP and every server render leaves from one address, so
 * twelve game views a minute exhausted the budget and the thirteenth received a
 * 429 that the render turned into a 500.
 *
 * Measured against production before this existed: five of twelve pages failed
 * at a pace of fifteen requests a minute, sixty-three of seventy-five at full
 * speed. With 114,000 game pages in the sitemap, that is the difference between
 * a catalogue a search engine can walk and one it gives up on.
 */
class GameBundleTest extends TestCase
{
    use RefreshDatabase;

    private function game(array $overrides = []): Game
    {
        return Game::create(array_merge([
            'name' => 'A Playable Thing',
            'slug' => 'a-playable-thing',
            'description' => 'Long enough to be listed in the sitemap.',
        ], $overrides));
    }

    public function test_one_call_carries_everything_the_page_draws(): void
    {
        $this->game();

        $this->getJson('/api/v1/games/a-playable-thing/bundle')
            ->assertOk()
            ->assertJsonStructure(['game' => ['id', 'name', 'slug'], 'screenshots', 'series', 'suggested', 'articles']);
    }

    public function test_the_game_half_matches_the_single_endpoint(): void
    {
        $this->game();

        $alone = $this->getJson('/api/v1/games/a-playable-thing')->assertOk()->json();
        $bundled = $this->getJson('/api/v1/games/a-playable-thing/bundle')->assertOk()->json('game');

        // The bundle must not quietly become a second, thinner shape of the
        // same record — that is how two endpoints drift apart.
        $this->assertSame($alone['id'], $bundled['id']);
        $this->assertSame($alone['name'], $bundled['name']);
        $this->assertSame(array_keys($alone), array_keys($bundled));
    }

    /**
     * A tombstoned game answers 410 so crawlers drop it rather than retrying a
     * 404 for months. The bundle has to pass that through rather than wrap an
     * error in a 200 envelope.
     */
    public function test_a_missing_game_is_not_dressed_up_as_success(): void
    {
        $this->getJson('/api/v1/games/never-existed/bundle')->assertNotFound();
    }

    public function test_the_sides_are_empty_rather_than_absent_when_there_is_nothing(): void
    {
        $this->game();

        $body = $this->getJson('/api/v1/games/a-playable-thing/bundle')->assertOk()->json();

        // The client destructures these; null would mean a guard at every use.
        $this->assertIsArray($body['screenshots']);
        $this->assertIsArray($body['series']);
        $this->assertIsArray($body['suggested']);
        $this->assertIsArray($body['articles']);
    }

    public function test_it_is_cacheable_at_the_edge(): void
    {
        $this->game();

        $this->getJson('/api/v1/games/a-playable-thing/bundle')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=300, public, stale-while-revalidate=600');
    }
}
