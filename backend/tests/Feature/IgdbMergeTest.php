<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Writing IGDB into our games.
 *
 * Almost every test here is about restraint. The data being added can always be
 * fetched again; a description somebody wrote and the merge replaced cannot, and
 * neither can the slug of a page that has been indexed for a year. So the things
 * worth pinning are the refusals: it fills only what is empty, it leaves locked
 * columns alone, and it does not touch the four things that are ours.
 */
class IgdbMergeTest extends TestCase
{
    use RefreshDatabase;

    private function raw(string $endpoint, int $id, array $payload): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => $endpoint,
            'igdb_id' => $id,
            'payload' => json_encode($payload + ['id' => $id]),
            'fetched_at' => now(),
        ]);
    }

    /** An IGDB game with a cover, a trailer, a studio and a series. */
    private function theirGame(int $id = 100, string $name = 'Hollow Knight', int $year = 2017): void
    {
        $this->raw('games', $id, [
            'name' => $name,
            'summary' => 'A summary from IGDB.',
            'first_release_date' => mktime(0, 0, 0, 2, 24, $year),
        ]);
        $this->raw('covers', 900, ['game' => $id, 'image_id' => 'co1abc']);
        $this->raw('game_videos', 901, ['game' => $id, 'video_id' => 'UAO2urG23S4', 'name' => 'Trailer']);
        $this->raw('companies', 902, ['name' => 'Team Cherry', 'slug' => 'team-cherry']);
        $this->raw('involved_companies', 903, ['game' => $id, 'company' => 902, 'developer' => true, 'publisher' => true]);
        $this->raw('alternative_names', 904, ['game' => $id, 'name' => 'HK', 'comment' => 'Also known as']);
        $this->raw('collections', 905, ['name' => 'Hollow Knight', 'slug' => 'hollow-knight', 'games' => [$id]]);

        $this->artisan('igdb:index');
    }

    private function ourGame(array $attributes = []): Game
    {
        return Game::create(array_merge([
            'name' => 'Hollow Knight',
            'slug' => 'hollow-knight-'.uniqid(),
            'released' => '2017-02-24',
        ], $attributes));
    }

    public function test_it_fills_the_fields_we_have_nothing_for(): void
    {
        $this->theirGame();
        $game = $this->ourGame();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertSame('A summary from IGDB.', $game->description);
        $this->assertStringContainsString('co1abc', (string) $game->cover_url);
        $this->assertSame(['Team Cherry'], $game->developers);
        $this->assertSame(['Team Cherry'], $game->publishers);
        $this->assertSame('Hollow Knight', $game->series_name);
    }

    /**
     * The shapes the game page reads, not the shapes IGDB returns.
     *
     * `GameController::show` hands these three columns to the front exactly as
     * they sit in the database, so whatever is written here is what React gets.
     * The page runs a YouTube regex over each entry of `videos` — an object
     * there is a TypeError on a server component, which is a 500 rather than a
     * missing trailer — and prints `.title` off each `alt_titles` entry, so
     * bare strings render as blank rows. `series_key` is an integer column
     * left over from the Moby group id; a slug in it fails the insert outright.
     *
     * All three were wrong in the first draft of the merge and all three looked
     * fine in the dry-run report, which counts fields it would fill without
     * knowing what shape it would fill them with.
     */
    public function test_it_writes_the_shapes_the_game_page_expects(): void
    {
        $this->theirGame();
        $game = $this->ourGame();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertSame(['https://www.youtube.com/watch?v=UAO2urG23S4'], $game->videos);
        $this->assertSame([['title' => 'HK', 'description' => 'Also known as']], $game->alt_titles);
        $this->assertSame(905, (int) $game->series_key);
    }

    /**
     * The one rule the whole command is built around. A description we already
     * hold was written by somebody or fetched from a store that had it right;
     * IGDB having a different one is not a reason to lose it.
     */
    public function test_it_never_replaces_something_we_already_have(): void
    {
        $this->theirGame();
        $game = $this->ourGame([
            'description' => 'Ours, written by hand.',
            'developers' => ['Somebody Else'],
        ]);

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertSame('Ours, written by hand.', $game->description);
        $this->assertSame(['Somebody Else'], $game->developers);
        /* And the empty ones beside them still filled. */
        $this->assertStringContainsString('co1abc', (string) $game->cover_url);
    }

    /** `locked_fields` is the existing way of saying "leave this alone". */
    public function test_a_locked_column_is_left_alone_even_when_empty(): void
    {
        $this->theirGame();
        $game = $this->ourGame(['locked_fields' => ['description', 'cover_url']]);

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertNull($game->description);
        $this->assertNull($game->cover_url);
        $this->assertSame(['Team Cherry'], $game->developers, 'unlocked columns should still fill');
    }

    /**
     * 114,861 of our game pages have been visited. A merge that renamed their
     * addresses would be the most expensive thing this project has ever done.
     */
    public function test_the_slug_and_the_view_count_are_never_touched(): void
    {
        $this->theirGame(100, 'Hollow Knight');
        $game = $this->ourGame(['slug' => 'our-own-slug']);

        /* Not through create() — `views` is guarded precisely because nothing
           should set it but the counter. */
        DB::table('games')->where('id', $game->id)->update(['views' => 4321]);

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $game->refresh();

        $this->assertSame('our-own-slug', $game->slug);
        $this->assertSame(4321, (int) $game->views);
    }

    /** The decision is recorded, so a second run knows instead of guessing. */
    public function test_it_remembers_which_igdb_game_it_chose(): void
    {
        $this->theirGame(100);
        $game = $this->ourGame();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_external_ids', [
            'game_id' => $game->id,
            'provider' => 'igdb',
            'external_id' => '100',
        ]);
    }

    /** Without --apply it is a report and nothing more. */
    public function test_without_apply_nothing_is_written(): void
    {
        $this->theirGame();
        $game = $this->ourGame();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id'])
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertNull($game->fresh()->description);
        $this->assertDatabaseMissing('game_external_ids', ['game_id' => $game->id, 'provider' => 'igdb']);
    }

    /** A game the matcher declined gets nothing, however much IGDB holds. */
    public function test_an_ambiguous_game_is_not_written_to(): void
    {
        $this->raw('games', 200, ['name' => 'Stronghold', 'first_release_date' => mktime(0, 0, 0, 1, 1, 1993), 'summary' => 'The 1993 one.']);
        $this->raw('games', 201, ['name' => 'Stronghold', 'first_release_date' => mktime(0, 0, 0, 1, 1, 2001), 'summary' => 'The 2001 one.']);
        $this->artisan('igdb:index');

        $game = Game::create(['name' => 'Stronghold', 'slug' => Str::slug('stronghold-x'), 'released' => null]);

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $this->assertNull($game->fresh()->description);
    }

    /**
     * --replace lifts the fill-only rule for one named column.
     *
     * Our descriptions came off store pages and average 1,292 characters of
     * marketing; theirs average 270 and describe the game. That is a judgement
     * the operator makes per run, which is why it is an option and not a rule.
     */
    public function test_replace_overwrites_only_the_named_column(): void
    {
        $this->theirGame();
        $game = $this->ourGame([
            'description' => 'Steam marketing copy.',
            'developers' => ['Somebody Else'],
        ]);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['description'], '--apply' => true,
        ])->assertSuccessful();

        $game->refresh();

        $this->assertSame('A summary from IGDB.', $game->description);
        $this->assertSame(['Somebody Else'], $game->developers, 'only the named column is replaced');
    }

    /** A game the redakcija wrote by hand is filled, never replaced. */
    public function test_an_editorial_game_keeps_what_a_person_wrote(): void
    {
        $this->theirGame();
        $game = $this->ourGame(['description' => 'Written in-house.']);
        DB::table('games')->where('id', $game->id)->update(['is_editorial' => true]);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['description'], '--apply' => true,
        ])->assertSuccessful();

        $game->refresh();

        $this->assertSame('Written in-house.', $game->description);
        $this->assertSame(['Team Cherry'], $game->developers, 'empty columns still fill on an editorial game');
    }

    /** Locking beats replacing — it is the stronger statement of the two. */
    public function test_a_locked_column_is_not_replaced_either(): void
    {
        $this->theirGame();
        $game = $this->ourGame([
            'description' => 'Ours, and locked.',
            'locked_fields' => ['description'],
        ]);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['description'], '--apply' => true,
        ])->assertSuccessful();

        $this->assertSame('Ours, and locked.', $game->fresh()->description);
    }

    /** A column name nobody recognises is a typo, not a request. */
    public function test_it_refuses_an_unknown_replace_field(): void
    {
        $this->theirGame();
        $game = $this->ourGame(['description' => 'Ours.']);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['descriptions'], '--apply' => true,
        ])->assertFailed();

        $this->assertSame('Ours.', $game->fresh()->description);
    }

    /**
     * Everything overwritten is written down first, and the written-down copy
     * is enough to put it back. Without this the option would be a one-way door
     * across 115,327 rows.
     */
    public function test_what_it_overwrites_can_be_put_back(): void
    {
        $this->theirGame();
        $game = $this->ourGame(['description' => 'The original text.']);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['description'], '--apply' => true,
        ])->assertSuccessful();

        $this->assertSame('A summary from IGDB.', $game->fresh()->description);

        $undo = collect(glob(storage_path('app/backups/igdb-replace-*.jsonl.gz')))->sortDesc()->first();
        $this->assertNotNull($undo, 'a replacing run must leave an undo file');

        $this->artisan('igdb:revert', ['file' => $undo, '--apply' => true])->assertSuccessful();

        $this->assertSame('The original text.', $game->fresh()->description);

        @unlink($undo);
    }

    /** Reverting onto an id that now belongs to something else is refused. */
    public function test_revert_skips_a_row_whose_slug_no_longer_agrees(): void
    {
        $this->theirGame();
        $game = $this->ourGame(['description' => 'The original text.']);

        $this->artisan('igdb:merge', [
            '--limit' => 10, '--order' => 'id', '--replace' => ['description'], '--apply' => true,
        ])->assertSuccessful();

        DB::table('games')->where('id', $game->id)->update(['slug' => 'a-different-game']);

        $undo = collect(glob(storage_path('app/backups/igdb-replace-*.jsonl.gz')))->sortDesc()->first();

        $this->artisan('igdb:revert', ['file' => $undo, '--apply' => true])
            ->expectsOutputToContain('nosi druga igra')
            ->assertSuccessful();

        $this->assertSame('A summary from IGDB.', $game->fresh()->description);

        @unlink($undo);
    }

    /**
     * --all walks the whole catalogue in chunks, and each chunk starts clean.
     *
     * The facts loader builds companies and collections by appending, so a chunk
     * that did not clear first would hand the second game the first one's studio.
     * Two games, one per chunk, each with a studio of its own is the smallest
     * arrangement that catches it.
     */
    public function test_a_chunked_run_does_not_leak_between_chunks(): void
    {
        $this->raw('games', 100, ['name' => 'Hollow Knight', 'first_release_date' => mktime(0, 0, 0, 2, 24, 2017)]);
        $this->raw('companies', 902, ['name' => 'Team Cherry']);
        $this->raw('involved_companies', 903, ['game' => 100, 'company' => 902, 'developer' => true]);

        $this->raw('games', 200, ['name' => 'Disco Elysium', 'first_release_date' => mktime(0, 0, 0, 10, 15, 2019)]);
        $this->raw('companies', 912, ['name' => 'ZA/UM']);
        $this->raw('involved_companies', 913, ['game' => 200, 'company' => 912, 'developer' => true]);

        $this->artisan('igdb:index');

        $first = $this->ourGame(['name' => 'Hollow Knight', 'released' => '2017-02-24']);
        $second = $this->ourGame(['name' => 'Disco Elysium', 'released' => '2019-10-15']);

        /* One game per chunk — anything larger puts both in the same load()
           and the leak this guards against cannot happen. */
        $this->artisan('igdb:merge', ['--all' => true, '--chunk' => 1, '--apply' => true])->assertSuccessful();

        $this->assertSame(['Team Cherry'], $first->fresh()->developers);
        $this->assertSame(['ZA/UM'], $second->fresh()->developers);
    }

    /** Running it twice changes nothing the second time. */
    public function test_a_second_run_is_a_no_op(): void
    {
        $this->theirGame();
        $game = $this->ourGame();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true]);
        $after = $game->fresh()->toArray();

        $this->artisan('igdb:merge', ['--limit' => 10, '--order' => 'id', '--apply' => true])->assertSuccessful();

        $this->assertSame($after, $game->fresh()->toArray());
    }
}
