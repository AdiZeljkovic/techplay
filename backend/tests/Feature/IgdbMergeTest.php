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
        $this->raw('alternative_names', 904, ['game' => $id, 'name' => 'HK']);
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
        $this->assertSame('UAO2urG23S4', $game->videos[0]['id']);
        $this->assertSame(['Team Cherry'], $game->developers);
        $this->assertSame(['Team Cherry'], $game->publishers);
        $this->assertSame(['HK'], $game->alt_titles);
        $this->assertSame('Hollow Knight', $game->series_name);
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
