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
            'cover_url' => 'https://img.test/cover.jpg',
            'description' => 'A game worth describing.',
            'released' => '2015-06-15',
            'genres' => ['Action'],
            'ratings_count' => 12,
        ], $attrs));
    }

    public function test_hidden_gems_returns_low_vote_high_rated_games(): void
    {
        $gem = $this->makeGame(['slug' => 'obscure-gem', 'ratings_count' => 7]);
        $this->makeGame(['slug' => 'famous-game', 'ratings_count' => 50000]);
        $this->makeGame(['slug' => 'low-rated', 'rating' => 4.0, 'ratings_count' => 5]);
        $this->makeGame(['slug' => 'untrusted-score', 'ratings_count' => 1]);

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
     * the ratings_count column, promoted from the old payload archive; only the
     * show payload renames it. Tying both endpoints to one fixture means
     * renaming the key on either side fails here.
     */
    public function test_vote_count_key_agrees_with_the_show_endpoint(): void
    {
        $game = $this->makeGame(['slug' => 'vote-key-check', 'ratings_count' => 9]);

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
            $this->makeGame(['slug' => "gem-{$i}", 'ratings_count' => 5 + $i]);
        }

        $first = $this->getJson('/api/v1/games/hidden-gems')->json('results');
        $second = $this->getJson('/api/v1/games/hidden-gems')->json('results');

        $this->assertSame(array_column($first, 'slug'), array_column($second, 'slug'));
    }

    public function test_hidden_gems_carry_a_line_about_the_game(): void
    {
        $this->makeGame([
            'slug' => 'wordy-gem',
            'ratings_count' => 5,
            'description' => '<p>The Array awaits.</p> Embark on a journey among the stars in Orion Drift. '
                .'You and your fellow robots were once premier athletes, and now you forge a destiny together.',
        ]);

        $gem = collect($this->getJson('/api/v1/games/hidden-gems')->json('results'))
            ->firstWhere('slug', 'wordy-gem');

        $this->assertNotNull($gem);
        // Markup stripped, whitespace collapsed, cut at a word boundary — a
        // third of the catalogue's descriptions carry HTML and they average
        // 642 characters.
        $this->assertStringNotContainsString('<', $gem['excerpt']);
        $this->assertStringStartsWith('The Array awaits. Embark', $gem['excerpt']);
        $this->assertLessThanOrEqual(141, mb_strlen($gem['excerpt']));
        $this->assertStringEndsWith('…', $gem['excerpt']);
    }

    public function test_every_gem_carries_an_excerpt(): void
    {
        $this->makeGame(['slug' => 'gem-one', 'ratings_count' => 4]);
        $this->makeGame(['slug' => 'gem-two', 'ratings_count' => 6]);

        $excerpts = array_column($this->getJson('/api/v1/games/hidden-gems')->json('results'), 'excerpt');

        // The query already requires a description, so a card should never be
        // handed an empty line to draw. This holds that door shut.
        $this->assertNotEmpty($excerpts);

        foreach ($excerpts as $excerpt) {
            $this->assertNotSame('', $excerpt);
        }
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

    public function test_on_this_day_also_carries_tomorrow(): void
    {
        $today = now();
        $tomorrow = $today->copy()->addDay();

        $this->makeGame(['slug' => 'today-anniversary', 'released' => $today->copy()->subYears(5)->toDateString()]);
        $this->makeGame(['slug' => 'tomorrow-anniversary', 'released' => $tomorrow->copy()->subYears(8)->toDateString()]);

        // The panel drew four games and left half its box empty. The material
        // was never the limit — 51 games clear the bar on 26 August alone.
        $response = $this->getJson('/api/v1/games/on-this-day')->assertOk();

        $this->assertContains('today-anniversary', array_column($response->json('results'), 'slug'));
        $this->assertContains('tomorrow-anniversary', array_column($response->json('tomorrow.results'), 'slug'));
        $this->assertSame($tomorrow->format('F j'), $response->json('tomorrow.date'));

        // Each day answers for itself: today's list must not carry tomorrow's.
        $this->assertNotContains('tomorrow-anniversary', array_column($response->json('results'), 'slug'));
    }

    public function test_each_day_reads_down_the_years(): void
    {
        $today = now();

        // Deliberately created out of order and with the older game rated
        // higher, so a list ordered by rating would come back 2010 then 2020.
        $this->makeGame(['slug' => 'older-but-better', 'rating' => 9.5, 'released' => $today->copy()->subYears(16)->toDateString()]);
        $this->makeGame(['slug' => 'newer', 'rating' => 8.0, 'released' => $today->copy()->subYears(6)->toDateString()]);

        $slugs = array_column($this->getJson('/api/v1/games/on-this-day')->json('results'), 'slug');

        // The panel draws a timeline, and one that runs 2013, 2014, 2021, 2012
        // reads as a fault rather than a sequence. Best chosen, newest shown
        // first.
        $this->assertSame(['newer', 'older-but-better'], $slugs);
    }

    public function test_on_this_day_excludes_games_released_today(): void
    {
        $this->makeGame(['slug' => 'released-today', 'released' => now()->toDateString()]);

        $slugs = array_column($this->getJson('/api/v1/games/on-this-day')->json('results'), 'slug');

        $this->assertNotContains('released-today', $slugs);
    }
}
