<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameSeries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A series gets a URL, and keeps it.
 *
 * `games.series_key` is a bare integer, so the address has to come from the
 * name — which means two things have to hold for the pages to be worth
 * publishing: the slug a sitemap announced must still resolve after the next
 * catalogue sync, and two series whose names slugify the same must not fight
 * over it.
 */
class GameSeriesTest extends TestCase
{
    use RefreshDatabase;

    private function game(array $attributes = []): Game
    {
        static $n = 0;
        $n++;

        return Game::create(array_merge([
            'slug' => 'game-'.$n,
            'name' => 'Game '.$n,
            'description' => str_repeat('A sentence about this game. ', 4),
        ], $attributes));
    }

    public function test_it_builds_a_slug_from_the_series_name(): void
    {
        $this->game(['series_key' => 39, 'series_name' => 'Final Fantasy', 'released' => '1987-12-18']);
        $this->game(['series_key' => 39, 'series_name' => 'Final Fantasy', 'released' => '2016-11-29']);

        $this->artisan('games:sync-series')->assertExitCode(0);

        $series = GameSeries::where('series_key', 39)->first();

        $this->assertSame('final-fantasy', $series->slug);
        $this->assertSame(2, $series->games_count);
        $this->assertSame(1987, $series->first_year);
        $this->assertSame(2016, $series->last_year);
    }

    public function test_an_accented_name_slugifies_the_way_php_does_it(): void
    {
        // The reason the slug is stored rather than computed in SQL: Postgres
        // would render this `pok-mon`, and the sitemap and the route would then
        // disagree about the address.
        $this->game(['series_key' => 314, 'series_name' => 'Pokémon']);

        $this->artisan('games:sync-series');

        $this->assertSame('pokemon', GameSeries::where('series_key', 314)->value('slug'));
    }

    public function test_a_slug_already_published_never_moves(): void
    {
        $this->game(['series_key' => 7, 'series_name' => 'Some Series']);
        $this->artisan('games:sync-series');

        // The aggregator renames the series upstream. The old URL is in the
        // sitemap and in whatever links to it, so it stays.
        Game::where('series_key', 7)->update(['series_name' => 'Some Series Remastered Collection']);
        $this->artisan('games:sync-series');

        $series = GameSeries::where('series_key', 7)->first();

        $this->assertSame('some-series', $series->slug, 'The published URL moved.');
        $this->assertSame('Some Series Remastered Collection', $series->name, 'The display name did not follow.');
    }

    public function test_two_series_that_slugify_alike_do_not_fight_over_the_url(): void
    {
        // Three games in the first, one in the second: the bigger series keeps
        // the bare slug regardless of which row the database returns first.
        $this->game(['series_key' => 100, 'series_name' => 'Hitman']);
        $this->game(['series_key' => 100, 'series_name' => 'Hitman']);
        $this->game(['series_key' => 100, 'series_name' => 'Hitman']);
        $this->game(['series_key' => 200, 'series_name' => 'HITMAN']);

        $this->artisan('games:sync-series');

        $this->assertSame('hitman', GameSeries::where('series_key', 100)->value('slug'));
        $this->assertSame('hitman-200', GameSeries::where('series_key', 200)->value('slug'));
    }

    public function test_a_series_whose_games_all_vanished_is_removed(): void
    {
        $this->game(['series_key' => 55, 'series_name' => 'Gone']);
        $this->artisan('games:sync-series');
        $this->assertTrue(GameSeries::where('series_key', 55)->exists());

        Game::where('series_key', 55)->delete();
        $this->artisan('games:sync-series');

        $this->assertFalse(GameSeries::where('series_key', 55)->exists());
    }

    public function test_only_a_series_with_three_described_games_is_worth_indexing(): void
    {
        // Two games: a list, not a series.
        $this->game(['series_key' => 1, 'series_name' => 'Pair']);
        $this->game(['series_key' => 1, 'series_name' => 'Pair']);

        // Three, but nothing written about any of them.
        foreach (range(1, 3) as $i) {
            $this->game(['series_key' => 2, 'series_name' => 'Bare', 'description' => null]);
        }

        // Three, with something to read.
        foreach (range(1, 3) as $i) {
            $this->game(['series_key' => 3, 'series_name' => 'Written']);
        }

        $this->artisan('games:sync-series');

        $indexable = GameSeries::indexable()->pluck('slug')->all();

        $this->assertSame(['written'], $indexable);
    }

    public function test_the_endpoint_answers_with_the_series_and_404s_for_anything_else(): void
    {
        $this->game(['series_key' => 42, 'series_name' => 'Mass Effect', 'released' => '2007-11-16', 'platforms' => ['PC', 'Xbox 360']]);
        $this->game(['series_key' => 42, 'series_name' => 'Mass Effect', 'released' => '2012-03-06', 'platforms' => ['PC']]);

        $this->artisan('games:sync-series');

        $this->getJson('/api/v1/games/series/mass-effect')
            ->assertOk()
            ->assertJsonPath('name', 'Mass Effect')
            ->assertJsonPath('games_count', 2)
            ->assertJsonPath('first_year', 2007);

        $this->getJson('/api/v1/games/series/not-a-series')->assertNotFound();
    }

    public function test_the_games_index_can_be_filtered_to_one_series(): void
    {
        $this->game(['series_key' => 9, 'series_name' => 'Halo', 'name' => 'Halo: Combat Evolved']);
        $this->game(['series_key' => 9, 'series_name' => 'Halo', 'name' => 'Halo 2']);
        $this->game(['name' => 'Something Else Entirely']);

        $this->artisan('games:sync-series');

        $response = $this->getJson('/api/v1/games?series=halo&page_size=20')->assertOk();

        $names = collect($response->json('results') ?? $response->json('data') ?? [])->pluck('name')->all();

        $this->assertCount(2, $names, 'The series filter did not narrow the list.');
        $this->assertNotContains('Something Else Entirely', $names);
    }

    public function test_an_unknown_series_filter_does_not_empty_the_catalogue(): void
    {
        // A stray ?series= on /games should be ignored, not answered with
        // nothing — the route for a real series 404s before reaching here.
        $this->game(['name' => 'Still Here']);

        $response = $this->getJson('/api/v1/games?series=nonsense')->assertOk();

        $names = collect($response->json('results') ?? $response->json('data') ?? [])->pluck('name')->all();

        $this->assertContains('Still Here', $names);
    }

    public function test_the_sitemap_lists_the_series_worth_reading_and_no_others(): void
    {
        // Three described entries: worth announcing.
        foreach (range(1, 3) as $i) {
            $this->game(['series_key' => 11, 'series_name' => 'Deep Series']);
        }

        // Two entries: a list, not a series.
        $this->game(['series_key' => 12, 'series_name' => 'Thin Series']);
        $this->game(['series_key' => 12, 'series_name' => 'Thin Series']);

        $this->artisan('games:sync-series');

        $xml = $this->get('/sitemap-series.xml')->assertOk()->getContent();

        $this->assertStringContainsString('/games/series/deep-series', $xml);
        $this->assertStringNotContainsString('/games/series/thin-series', $xml);
    }

    public function test_the_index_names_the_series_file_only_when_something_is_in_it(): void
    {
        // The failure this guards against has happened here before:
        // sitemap-videos.xml was named by the index and written by nobody.
        $this->assertStringNotContainsString(
            'sitemap-series.xml',
            $this->get('/sitemap.xml')->assertOk()->getContent(),
            'The index announced a series file with no series behind it.',
        );

        foreach (range(1, 3) as $i) {
            $this->game(['series_key' => 21, 'series_name' => 'Now There Is One']);
        }
        $this->artisan('games:sync-series');

        $this->assertStringContainsString(
            'sitemap-series.xml',
            $this->get('/sitemap.xml')->assertOk()->getContent(),
        );
    }
}
