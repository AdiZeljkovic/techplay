<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameRating;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Two numbers that both look like "how many people rated this".
 *
 * `games.ratings_count` arrived with the catalogue — 106 for Cyberpunk, 61 for
 * Metro: Last Light — and the game page was using it to decide whether to ask
 * for the reviews written here. It is non-zero for most of a 332,455-game
 * catalogue, so the guard passed almost every time and the request went out to
 * come back with an empty aggregate: 985 of them in one day, from real
 * browsers, against a table holding no rows at all.
 *
 * `reader_ratings_count` counts the same rows the ratings endpoint counts, the
 * same way — by slug, published only. A guard that counts differently from the
 * endpoint it guards is the original bug with a new number.
 */
class ReaderRatingsAreNotTheCataloguesTest extends TestCase
{
    use RefreshDatabase;

    private function game(int $catalogueVotes): Game
    {
        return Game::create([
            'slug' => 'cyberpunk-2077',
            'name' => 'Cyberpunk 2077',
            'released' => '2020-12-10',
            'rating' => 4.2,
            'ratings_count' => $catalogueVotes,
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function payload(): array
    {
        return $this->getJson('/api/v1/games/cyberpunk-2077')->assertOk()->json();
    }

    #[Test]
    public function a_catalogue_vote_count_is_not_a_reader_rating(): void
    {
        $this->game(catalogueVotes: 106);

        $body = $this->payload();

        $this->assertSame(106, $body['ratings_count'], 'the catalogue figure is still reported');
        $this->assertSame(0, $body['reader_ratings_count'], 'nobody here has rated it');
    }

    #[Test]
    public function a_rating_written_here_is_counted(): void
    {
        $game = $this->game(catalogueVotes: 106);

        GameRating::create([
            'user_id' => User::factory()->create()->id,
            'game_id' => $game->id,
            'game_slug' => $game->slug,
            'rating' => 5,
            'review' => 'Held up better than the launch did.',
            'is_draft' => false,
        ]);

        $this->assertSame(1, $this->payload()['reader_ratings_count']);
    }

    /**
     * The endpoint excludes drafts from the aggregate, so the count that
     * decides whether to call it must exclude them too — otherwise the page
     * asks, and gets nothing back.
     */
    #[Test]
    public function a_draft_does_not_make_the_page_ask(): void
    {
        $game = $this->game(catalogueVotes: 106);

        GameRating::create([
            'user_id' => User::factory()->create()->id,
            'game_id' => $game->id,
            'game_slug' => $game->slug,
            'rating' => 4,
            'review' => 'Still writing this one.',
            'is_draft' => true,
        ]);

        $this->assertSame(0, $this->payload()['reader_ratings_count']);
    }

    /**
     * The guard and the endpoint have to agree, whatever the data is.
     */
    #[Test]
    public function the_count_matches_what_the_ratings_endpoint_reports(): void
    {
        $game = $this->game(catalogueVotes: 106);

        foreach ([5, 4, 3] as $i => $stars) {
            GameRating::create([
                'user_id' => User::factory()->create()->id,
                'game_id' => $game->id,
                'game_slug' => $game->slug,
                'rating' => $stars,
                'review' => "Review {$i}",
                'is_draft' => false,
            ]);
        }

        $fromEndpoint = $this->getJson('/api/v1/games/cyberpunk-2077/ratings')
            ->assertOk()->json('aggregate.count');

        $this->assertSame($fromEndpoint, $this->payload()['reader_ratings_count']);
    }
}
