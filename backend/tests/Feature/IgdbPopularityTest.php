<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Real popularity, in place of a number we made up.
 *
 * The one thing that must hold is that games are never compared across
 * measures. Steam's 24-hour peak players tops out around 0.19 and Twitch hours
 * watched around 0.26; a list sorted on the raw values would rank by whichever
 * measure produces bigger numbers, which is not a fact about any game. Each
 * game is placed within its own measure, and the measure is written down.
 */
class IgdbPopularityTest extends TestCase
{
    use RefreshDatabase;

    private function type(int $id, string $name): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'popularity_types',
            'igdb_id' => $id,
            'payload' => json_encode(['id' => $id, 'name' => $name]),
            'fetched_at' => now(),
        ]);
    }

    private function primitive(int $id, int $igdbGame, int $type, float $value): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'popularity_primitives',
            'igdb_id' => $id,
            'payload' => json_encode([
                'id' => $id,
                'game_id' => $igdbGame,
                'popularity_type' => $type,
                'value' => $value,
            ]),
            'fetched_at' => now(),
        ]);
    }

    private function ourGame(string $name, int $igdbId, ?string $released): Game
    {
        $game = Game::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'released' => $released,
        ]);

        DB::table('game_external_ids')->insert([
            'game_id' => $game->id,
            'provider' => 'igdb',
            'external_id' => (string) $igdbId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $game;
    }

    private function types(): void
    {
        $this->type(1, 'Visits');
        $this->type(2, 'Want to Play');
        $this->type(5, '24hr Peak Players');
        $this->type(10, 'Most Wishlisted Upcoming');
    }

    /** A released game is judged by who is playing it, and the measure is named. */
    public function test_a_released_game_gets_its_standing_among_steam_players(): void
    {
        $this->types();

        $game = $this->ourGame('Popular Game', 100, '2019-01-01');
        $this->primitive(1, 100, 5, 0.19);
        /* Three more games in the same measure, all below it. */
        $this->primitive(2, 101, 5, 0.02);
        $this->primitive(3, 102, 5, 0.01);
        $this->primitive(4, 103, 5, 0.005);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertSame(100, (int) $game->popularity, 'above everything else in its measure');
        $this->assertSame('24hr Peak Players', $game->popularity_metric);
        $this->assertSame(0.19, (float) $game->popularity_raw);
    }

    /**
     * An upcoming game is judged by who wants it, which is the question the
     * hand-rolled hype score was invented to answer.
     */
    public function test_an_upcoming_game_is_judged_by_wishlists(): void
    {
        $this->types();

        $game = $this->ourGame('Coming Soon', 200, now()->addYear()->toDateString());
        $this->primitive(1, 200, 10, 0.20);
        $this->primitive(2, 200, 5, 0.01);       // it also has peak players
        $this->primitive(3, 201, 10, 0.01);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $this->assertSame('Most Wishlisted Upcoming', $game->fresh()->popularity_metric);
    }

    /** Not on Steam is not unpopular — it falls through to what IGDB has. */
    public function test_a_game_without_the_first_measure_falls_back(): void
    {
        $this->types();

        $game = $this->ourGame('Not On Steam', 300, '2015-01-01');
        $this->primitive(1, 300, 1, 0.04);
        $this->primitive(2, 301, 1, 0.01);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $this->assertSame('Visits', $game->fresh()->popularity_metric);
    }

    /**
     * The percentile is within the measure, never across measures. A game that
     * leads a small measure and one that leads a large one both read 100 — and
     * a raw 0.01 in one measure can outrank a raw 0.19 in another.
     */
    public function test_the_percentile_is_within_the_measure_not_across_measures(): void
    {
        $this->types();

        $leader = $this->ourGame('Leads A Quiet Measure', 400, '2015-01-01');
        $follower = $this->ourGame('Trails A Loud One', 401, '2015-01-01');

        /* Visits: our leader is the only one, so it tops that measure. */
        $this->primitive(1, 400, 1, 0.001);

        /* Peak players: bigger raw number, but bottom of four. */
        $this->primitive(2, 401, 5, 0.02);
        $this->primitive(3, 402, 5, 0.10);
        $this->primitive(4, 403, 5, 0.15);
        $this->primitive(5, 404, 5, 0.19);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $this->assertSame(100, (int) $leader->fresh()->popularity);
        $this->assertLessThan(50, (int) $follower->fresh()->popularity);
        $this->assertGreaterThan(
            (float) $leader->fresh()->popularity_raw,
            (float) $follower->fresh()->popularity_raw,
            'the one that ranks lower has the larger raw value — which is the whole point',
        );
    }

    /** IGDB spells one of their own measures wrong; we do not repeat it. */
    public function test_their_typo_is_not_carried_onto_our_pages(): void
    {
        $this->type(6, 'Postitive Reviews');
        $this->type(5, '24hr Peak Players');

        $game = $this->ourGame('Reviewed Game', 500, '2015-01-01');
        $this->primitive(1, 500, 5, 0.05);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $this->assertSame('24hr Peak Players', $game->fresh()->popularity_metric);
        $this->assertDatabaseMissing('games', ['popularity_metric' => 'Postitive Reviews']);
    }

    /** A game IGDB has no reading for says nothing rather than zero. */
    public function test_a_game_with_no_reading_is_left_null(): void
    {
        $this->types();

        $game = $this->ourGame('Unmeasured', 600, '2015-01-01');
        $this->primitive(1, 999, 5, 0.05);

        $this->artisan('igdb:popularity', ['--apply' => true])->assertSuccessful();

        $this->assertNull($game->fresh()->popularity);
        $this->assertNull($game->fresh()->popularity_metric);
    }

    public function test_without_apply_nothing_is_written(): void
    {
        $this->types();

        $game = $this->ourGame('Popular Game', 100, '2019-01-01');
        $this->primitive(1, 100, 5, 0.19);

        $this->artisan('igdb:popularity')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertNull($game->fresh()->popularity);
    }

    /** The catalogue can be ordered by it, and the games without stay behind. */
    public function test_the_games_list_can_be_ordered_by_popularity(): void
    {
        $unmeasured = Game::create(['name' => 'Unmeasured', 'slug' => 'unmeasured', 'released' => '2019-01-01']);
        $middling = Game::create(['name' => 'Middling', 'slug' => 'middling', 'released' => '2019-01-01']);
        $top = Game::create(['name' => 'Top', 'slug' => 'top', 'released' => '2019-01-01']);

        DB::table('games')->where('id', $middling->id)->update(['popularity' => 40]);
        DB::table('games')->where('id', $top->id)->update(['popularity' => 98]);

        $names = collect($this->getJson('/api/v1/games?ordering=-popularity')->json('results'))->pluck('name');

        $this->assertSame('Top', $names->first());
        $this->assertSame('Unmeasured', $names->last(), 'no reading sorts behind a low one');
        $this->assertTrue($names->contains($unmeasured->name));
    }

    /**
     * A percentile of 100 means "top half a percent of its measure", and about
     * two hundred games sit there. Ties break on our own page views, so the
     * most visible list in the section does not reshuffle between requests.
     */
    public function test_games_tied_on_popularity_are_ordered_by_our_own_views(): void
    {
        $quiet = Game::create(['name' => 'Tied But Quiet', 'slug' => 'tied-quiet', 'released' => '2019-01-01']);
        $read = Game::create(['name' => 'Tied And Read', 'slug' => 'tied-read', 'released' => '2019-01-01']);

        DB::table('games')->where('id', $quiet->id)->update(['popularity' => 100, 'views' => 3]);
        DB::table('games')->where('id', $read->id)->update(['popularity' => 100, 'views' => 9000]);

        $names = collect($this->getJson('/api/v1/games?ordering=-popularity')->json('results'))->pluck('name');

        $this->assertSame(['Tied And Read', 'Tied But Quiet'], $names->all());
    }

    /** The game page carries the standing with the measure that produced it. */
    public function test_the_game_page_names_the_measure(): void
    {
        $game = Game::create(['name' => 'Measured', 'slug' => 'measured', 'released' => '2019-01-01']);

        DB::table('games')->where('id', $game->id)->update([
            'popularity' => 97,
            'popularity_metric' => '24hr Peak Players',
            'popularity_raw' => 0.12,
        ]);

        $this->getJson('/api/v1/games/measured')
            ->assertOk()
            ->assertJsonPath('popularity.percentile', 97)
            ->assertJsonPath('popularity.metric', '24hr Peak Players');
    }
}
