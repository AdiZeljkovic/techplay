<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The matching, before it is allowed to write anything.
 *
 * The thing worth pinning here is not that matching works — it is that it
 * refuses. A merge across two catalogues of a hundred thousand rows is only as
 * good as the cases it declines to take, and the expensive failure is not a game
 * left alone: it is Alien (1982) quietly acquiring the summary of Alien (2023).
 *
 * Note there are no `external_games` rows in any of these. That path reads jsonb
 * through PostgreSQL operators and these tests run on SQLite; it is guarded to
 * return nothing when the endpoint has not been pulled, which is also the state
 * the first real trial runs in.
 */
class IgdbTrialTest extends TestCase
{
    use RefreshDatabase;

    private function igdbGame(int $id, string $name, ?int $year, array $extra = []): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => $id,
            'payload' => json_encode(array_merge([
                'id' => $id,
                'name' => $name,
                'first_release_date' => $year ? mktime(0, 0, 0, 6, 1, $year) : null,
            ], $extra)),
            'fetched_at' => now(),
        ]);
    }

    private function ourGame(string $name, ?string $released, array $extra = []): Game
    {
        return Game::create(array_merge([
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'released' => $released,
        ], $extra));
    }

    /** The index has to reduce a title the same way the store aggregator does. */
    public function test_the_index_stores_the_normalised_title(): void
    {
        $this->igdbGame(1, 'Lies of P: Complete Edition', 2023);

        $this->artisan('igdb:index')->assertSuccessful();

        $row = DB::table('igdb_game_keys')->where('igdb_id', 1)->first();

        $this->assertSame('lies of p', $row->match_key, 'the edition suffix should not be part of the key');
        $this->assertSame(2023, (int) $row->release_year);
    }

    /**
     * A title shared by several games is only ambiguous until you know the year.
     * This is the case that makes the whole merge worth doing rather than
     * abandoning.
     */
    public function test_the_year_picks_the_right_game_out_of_several(): void
    {
        $this->igdbGame(10, 'Alien', 1982);
        $this->igdbGame(11, 'Alien', 2023);
        $this->artisan('igdb:index');

        $this->ourGame('Alien', '2023-05-01');

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('naziv + godina')
            ->assertSuccessful();

        /* The trial writes nothing — the proof it chose correctly is the report,
           and the proof it wrote nothing is the row being untouched. */
        $this->assertNull(Game::first()->description);
    }

    /**
     * Several candidates and no year to separate them is exactly the case that
     * must be declined. Getting this wrong is how a 1982 game ends up described
     * as a 2023 one.
     */
    public function test_several_candidates_without_a_year_are_left_alone(): void
    {
        $this->igdbGame(20, 'Stronghold', 1993);
        $this->igdbGame(21, 'Stronghold', 2001);
        $this->igdbGame(22, 'Stronghold', 2023);
        $this->artisan('igdb:index');

        $this->ourGame('Stronghold', null);

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('vise kandidata')
            ->assertSuccessful();
    }

    /** A year we hold that none of theirs share is not a match either. */
    public function test_a_year_that_matches_nothing_is_not_forced(): void
    {
        $this->igdbGame(30, 'Traffic', 1984);
        $this->igdbGame(31, 'Traffic', 2022);
        $this->artisan('igdb:index');

        $this->ourGame('Traffic', '1999-01-01');

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('vise kandidata')
            ->assertSuccessful();
    }

    /** One candidate and one only: safe on the title alone. */
    public function test_a_single_candidate_matches_on_the_title(): void
    {
        $this->igdbGame(40, 'Disco Elysium', 2019);
        $this->artisan('igdb:index');

        $this->ourGame('Disco Elysium', null);

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('samo naziv')
            ->assertSuccessful();
    }

    /** What IGDB does not have stays as it is, and is counted as such. */
    public function test_a_title_they_do_not_have_is_reported_as_missing(): void
    {
        $this->igdbGame(50, 'Something Else Entirely', 2020);
        $this->artisan('igdb:index');

        $this->ourGame('Zejturn', '2011-01-01');

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('Nema u IGDB-u')
            ->assertSuccessful();
    }

    /** Refuses rather than reporting an empty run as a clean one. */
    public function test_it_stops_when_the_index_has_not_been_built(): void
    {
        $this->ourGame('Anything', null);

        $this->artisan('igdb:trial')->assertFailed();
    }

    /** The whole point: a trial leaves the catalogue exactly as it found it. */
    public function test_the_trial_writes_nothing(): void
    {
        $this->igdbGame(60, 'Hollow Knight', 2017, ['summary' => 'A summary IGDB has.']);
        $this->artisan('igdb:index');

        $game = $this->ourGame('Hollow Knight', '2017-02-24');
        $before = $game->fresh()->toArray();

        $this->artisan('igdb:trial', ['--limit' => 10, '--order' => 'id'])->assertSuccessful();

        $this->assertSame($before, $game->fresh()->toArray());
    }
}
