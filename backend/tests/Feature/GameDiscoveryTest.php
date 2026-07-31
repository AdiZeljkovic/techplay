<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    private function makeGame(array $attrs = []): Game
    {
        return Game::create(array_merge([
            'slug' => 'game-'.uniqid(),
            'name' => 'Test Game',
            'rating' => 8.5,
            'background_image' => 'https://img.test/cover.jpg',
            'has_description' => true,
            'released' => '2015-06-15',
            'genre_names' => ['Action'],
            'details_data' => ['num_votes' => 12],
        ], $attrs));
    }

    public function test_hidden_gems_returns_low_vote_high_rated_games(): void
    {
        $gem = $this->makeGame(['slug' => 'obscure-gem', 'details_data' => ['num_votes' => 7]]);
        $this->makeGame(['slug' => 'famous-game', 'details_data' => ['num_votes' => 50000]]);
        $this->makeGame(['slug' => 'low-rated', 'rating' => 4.0, 'details_data' => ['num_votes' => 5]]);
        $this->makeGame(['slug' => 'untrusted-score', 'details_data' => ['num_votes' => 1]]);

        $response = $this->getJson('/api/v1/games/hidden-gems');

        $response->assertStatus(200);
        $slugs = array_column($response->json('results'), 'slug');

        $this->assertContains($gem->slug, $slugs);
        $this->assertNotContains('low-rated', $slugs);        // score too low
        $this->assertNotContains('untrusted-score', $slugs);  // single vote proves nothing
        $this->assertLessThanOrEqual(6, count($slugs));
    }

    /**
     * Guards the bug that shipped empty to production: hidden-gems read
     * `details_data->ratings_count`, but Moby stores `num_votes` and only the
     * show payload renames it. Tying both endpoints to one fixture means
     * renaming the key on either side fails here.
     */
    public function test_vote_count_key_agrees_with_the_show_endpoint(): void
    {
        $game = $this->makeGame(['slug' => 'vote-key-check', 'details_data' => ['num_votes' => 9]]);

        $this->getJson("/api/v1/games/{$game->slug}")
            ->assertStatus(200)
            ->assertJsonPath('ratings_count', 9);

        $gems = $this->getJson('/api/v1/games/hidden-gems')->json('results');

        $this->assertContains($game->slug, array_column($gems, 'slug'));
        $this->assertSame(9, $gems[0]['votes']);
    }

    public function test_hidden_gems_rotation_is_stable_within_a_day(): void
    {
        foreach (range(1, 8) as $i) {
            $this->makeGame(['slug' => "gem-{$i}", 'details_data' => ['num_votes' => 5 + $i]]);
        }

        $first = $this->getJson('/api/v1/games/hidden-gems')->json('results');
        $second = $this->getJson('/api/v1/games/hidden-gems')->json('results');

        $this->assertSame(array_column($first, 'slug'), array_column($second, 'slug'));
    }

    public function test_on_this_day_matches_month_and_day_across_years(): void
    {
        $today = now();
        $match = $this->makeGame([
            'slug' => 'anniversary-game',
            'released' => $today->copy()->subYears(9)->toDateString(),
        ]);
        $this->makeGame([
            'slug' => 'other-day',
            'released' => $today->copy()->subYears(9)->addDays(3)->toDateString(),
        ]);

        $response = $this->getJson('/api/v1/games/on-this-day');

        $response->assertStatus(200);
        $results = $response->json('results');
        $slugs = array_column($results, 'slug');

        $this->assertContains($match->slug, $slugs);
        $this->assertNotContains('other-day', $slugs);
        $this->assertSame(9, $results[array_search($match->slug, $slugs, true)]['years_ago']);
    }

    public function test_on_this_day_excludes_games_released_today(): void
    {
        $this->makeGame(['slug' => 'released-today', 'released' => now()->toDateString()]);

        $slugs = array_column($this->getJson('/api/v1/games/on-this-day')->json('results'), 'slug');

        $this->assertNotContains('released-today', $slugs);
    }
}
