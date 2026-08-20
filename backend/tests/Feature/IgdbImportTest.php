<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Bringing in the titles we do not have.
 *
 * The import adds rows, so the tests that matter are the ones about what it
 * refuses to add. Three of those refusals are invisible if you get them wrong:
 * a resurrected tombstone looks like a new game, a duplicate of a title we
 * already hold looks like a new game, and a `match_key` written where it should
 * be NULL looks like nothing at all until the release aggregator starts
 * treating 185,000 IGDB rows as its own.
 */
class IgdbImportTest extends TestCase
{
    use RefreshDatabase;

    private function igdbGame(int $id, string $name, array $extra = []): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => $id,
            'payload' => json_encode(array_merge([
                'id' => $id,
                'name' => $name,
                'game_type' => 0,
                'cover' => 500 + $id,
            ], $extra)),
            'fetched_at' => now(),
        ]);
    }

    private function importAll(): void
    {
        $this->artisan('igdb:index');
        $this->artisan('igdb:import', ['--apply' => true])->assertSuccessful();
    }

    public function test_it_creates_a_game_we_do_not_have(): void
    {
        $this->igdbGame(1, 'Outer Wilds', [
            'summary' => 'A space archaeology game.',
            'first_release_date' => gmmktime(0, 0, 0, 5, 28, 2019),
        ]);

        $this->importAll();

        $game = Game::where('name', 'Outer Wilds')->first();

        $this->assertNotNull($game);
        $this->assertSame('outer-wilds', $game->slug);
        $this->assertSame('A space archaeology game.', $game->description);
        $this->assertSame('2019-05-28', $game->released->toDateString());
        $this->assertDatabaseHas('game_external_ids', [
            'game_id' => $game->id, 'provider' => 'igdb', 'external_id' => '1',
        ]);
    }

    /**
     * A non-null match_key means "the release aggregator owns this row".
     * GameMerger, Notability and StoreSync all key off it, and 185,000 imported
     * rows carrying one would be pulled into passes written for a few thousand
     * store listings. IGDB's own keys live in igdb_game_keys.
     */
    public function test_it_leaves_match_key_null(): void
    {
        $this->igdbGame(1, 'Outer Wilds', ['first_release_date' => gmmktime(0, 0, 0, 5, 28, 2019)]);

        $this->importAll();

        $this->assertNull(Game::where('name', 'Outer Wilds')->value('match_key'));
    }

    /** A slug we answer 410 for is not a free slug. */
    public function test_it_does_not_resurrect_a_tombstoned_game(): void
    {
        $this->igdbGame(1, 'Removed Game', ['first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015)]);

        DB::table('game_tombstones')->insert([
            'slug' => 'removed-game',
            'name' => 'Removed Game',
            'reason' => 'adult',
            'deleted_at' => now(),
        ]);

        $this->importAll();

        $this->assertDatabaseMissing('games', ['name' => 'Removed Game']);
    }

    /** Erotic content was purged from this catalogue on purpose. */
    public function test_it_skips_erotic_titles(): void
    {
        $this->igdbGame(1, 'Some Eroge', ['themes' => [1, 42], 'first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015)]);

        $this->importAll();

        $this->assertDatabaseMissing('games', ['name' => 'Some Eroge']);
    }

    /** DLC, mods, ports, packs and bundles are not separate products. */
    public function test_it_skips_everything_that_is_not_a_standalone_game(): void
    {
        $this->igdbGame(1, 'Some DLC', ['game_type' => 1, 'first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015)]);
        $this->igdbGame(2, 'Some Port', ['game_type' => 11, 'first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015)]);
        $this->igdbGame(3, 'A Remaster', ['game_type' => 9, 'first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015)]);

        $this->importAll();

        $this->assertDatabaseMissing('games', ['name' => 'Some DLC']);
        $this->assertDatabaseMissing('games', ['name' => 'Some Port']);
        $this->assertDatabaseHas('games', ['name' => 'A Remaster']);
    }

    /** A title with nothing behind it is a page with nothing on it. */
    public function test_it_skips_a_title_with_no_cover_date_or_studio(): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => 9,
            'payload' => json_encode(['id' => 9, 'name' => 'Bare Entry', 'game_type' => 0]),
            'fetched_at' => now(),
        ]);

        $this->importAll();

        $this->assertDatabaseMissing('games', ['name' => 'Bare Entry']);
    }

    /** The same title and year we already hold is the same game. */
    public function test_it_does_not_duplicate_a_game_we_already_have(): void
    {
        $this->igdbGame(1, 'Hollow Knight', ['first_release_date' => gmmktime(0, 0, 0, 2, 24, 2017)]);

        Game::create(['name' => 'Hollow Knight', 'slug' => 'hollow-knight', 'released' => '2017-02-24']);

        $this->importAll();

        $this->assertSame(1, Game::where('name', 'Hollow Knight')->count());
    }

    /**
     * A different year is a different game, and this is the case the whole
     * import is for — Alien (1982) and Alien (2023) are not the same title.
     */
    public function test_the_same_title_in_another_year_does_come_in(): void
    {
        $this->igdbGame(1, 'Alien', ['first_release_date' => gmmktime(0, 0, 0, 1, 1, 1982)]);

        Game::create(['name' => 'Alien', 'slug' => 'alien', 'released' => '2023-05-01']);

        $this->importAll();

        $this->assertSame(2, Game::where('name', 'Alien')->count());
        $this->assertNotNull(Game::where('slug', 'alien-2')->first(), 'the second one gets its own slug');
    }

    /** Ours without a year cannot be told from theirs, so theirs stays out. */
    public function test_a_title_we_hold_without_a_year_blocks_the_import(): void
    {
        $this->igdbGame(1, 'Stronghold', ['first_release_date' => gmmktime(0, 0, 0, 1, 1, 2001)]);

        Game::create(['name' => 'Stronghold', 'slug' => 'stronghold', 'released' => null]);

        $this->importAll();

        $this->assertSame(1, Game::where('name', 'Stronghold')->count());
    }

    /** A date known only to the year lands on 1 January; saying "day" is a lie. */
    public function test_a_year_only_date_is_recorded_as_year_precision(): void
    {
        $this->igdbGame(1, 'Old Game', ['first_release_date' => gmmktime(0, 0, 0, 1, 1, 1994)]);
        $this->igdbGame(2, 'Dated Game', ['first_release_date' => gmmktime(0, 0, 0, 6, 12, 1994)]);

        $this->importAll();

        $this->assertSame('year', Game::where('name', 'Old Game')->value('release_precision'));
        $this->assertSame('day', Game::where('name', 'Dated Game')->value('release_precision'));
    }

    /** Their 0-100 against our decimal(3,2), which stops at 9.99. */
    public function test_a_perfect_score_does_not_overflow_the_rating_column(): void
    {
        $this->igdbGame(1, 'Beloved Game', [
            'first_release_date' => gmmktime(0, 0, 0, 1, 1, 2015),
            'total_rating' => 100,
            'total_rating_count' => 4200,
        ]);

        $this->importAll();

        $game = Game::where('name', 'Beloved Game')->first();

        $this->assertSame(9.99, (float) $game->rating);
        $this->assertSame(4200, (int) $game->ratings_count);
    }

    /**
     * Games differ in what IGDB holds for them, rows in a batch must not.
     *
     * A bulk insert builds one VALUES list per row and Postgres requires them
     * all to be the same length, so a game with no score sitting beside one
     * with a score failed the whole batch — on the live catalogue, at the first
     * pair it reached. Every row is now built against a fixed column list.
     */
    public function test_games_with_different_data_go_into_one_batch(): void
    {
        $this->igdbGame(1, 'Scored Game', [
            'first_release_date' => gmmktime(0, 0, 0, 3, 1, 2020),
            'total_rating' => 88.5,
            'total_rating_count' => 120,
        ]);
        $this->igdbGame(2, 'Bare Scored Game', ['first_release_date' => gmmktime(0, 0, 0, 3, 1, 2021)]);

        $this->importAll();

        $scored = Game::where('name', 'Scored Game')->first();
        $bare = Game::where('name', 'Bare Scored Game')->first();

        $this->assertNotNull($scored);
        $this->assertNotNull($bare);
        $this->assertSame(8.85, round((float) $scored->rating, 2));
        $this->assertNull($bare->rating);
        $this->assertSame(0, (int) $bare->ratings_count);
    }

    /** Without --apply it is a report and nothing more. */
    public function test_without_apply_nothing_is_created(): void
    {
        $this->igdbGame(1, 'Outer Wilds', ['first_release_date' => gmmktime(0, 0, 0, 5, 28, 2019)]);

        $this->artisan('igdb:index');
        $this->artisan('igdb:import')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertSame(0, Game::count());
    }

    /** Running it twice does not import the same title again. */
    public function test_a_second_run_imports_nothing_new(): void
    {
        $this->igdbGame(1, 'Outer Wilds', ['first_release_date' => gmmktime(0, 0, 0, 5, 28, 2019)]);

        $this->importAll();
        $this->assertSame(1, Game::count());

        $this->artisan('igdb:import', ['--apply' => true])->assertSuccessful();
        $this->assertSame(1, Game::count());
    }
}
