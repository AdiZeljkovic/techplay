<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Studio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Turning IGDB's companies into studios of our own.
 *
 * The shape worth holding is that a studio is defined by our catalogue, not by
 * theirs: a company with no game we hold gets no row, because a page listing
 * nothing is not a page. The rest is about roles staying apart — the same
 * company is developer on one game and publisher on another, and a reader
 * asking what Arkane made should not be handed what Bethesda put out.
 */
class IgdbStudiosTest extends TestCase
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

    /** One of our games, already matched to an IGDB game. */
    private function ourGame(string $name, int $igdbId): Game
    {
        $game = Game::create(['name' => $name, 'slug' => Str::slug($name), 'released' => '2019-01-01']);

        DB::table('game_external_ids')->insert([
            'game_id' => $game->id,
            'provider' => 'igdb',
            'external_id' => (string) $igdbId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $game;
    }

    public function test_it_creates_a_studio_and_links_the_game(): void
    {
        $game = $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, [
            'name' => 'Arkane Studios',
            'slug' => 'arkane-studios',
            'description' => 'A French studio.',
            'country' => 250,
            'start_date' => gmmktime(0, 0, 0, 1, 1, 1999),
            'logo' => 900,
            'websites' => [800],
        ]);
        $this->raw('company_logos', 900, ['image_id' => 'cl9xy']);
        $this->raw('company_websites', 800, ['url' => 'https://arkanestudios.com/']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $studio = Studio::where('igdb_id', 10)->first();

        $this->assertNotNull($studio);
        $this->assertSame('Arkane Studios', $studio->name);
        $this->assertSame('arkane-studios', $studio->slug);
        $this->assertSame('A French studio.', $studio->description);
        $this->assertSame(250, $studio->country);
        $this->assertSame('1999-01-01', $studio->founded->toDateString());
        $this->assertStringContainsString('cl9xy', $studio->logo_url);
        $this->assertSame('https://arkanestudios.com/', $studio->website);

        $this->assertTrue($studio->developed->contains($game));
        $this->assertSame(1, $studio->games_count);
        $this->assertSame(1, $studio->developed_count);
    }

    /** A company none of our games belong to is not a studio of ours. */
    public function test_a_company_with_no_game_of_ours_gets_no_row(): void
    {
        $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, ['name' => 'Arkane Studios', 'slug' => 'arkane-studios']);
        $this->raw('companies', 11, ['name' => 'Nobody We Hold', 'slug' => 'nobody']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);
        $this->raw('involved_companies', 21, ['game' => 999, 'company' => 11, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, Studio::count());
        $this->assertNull(Studio::where('name', 'Nobody We Hold')->first());
    }

    /** Developer and publisher are separate answers to separate questions. */
    public function test_the_two_roles_stay_apart(): void
    {
        $made = $this->ourGame('Dishonored', 100);
        $putOut = $this->ourGame('Some Other Game', 101);

        $this->raw('companies', 10, ['name' => 'Bethesda', 'slug' => 'bethesda']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'publisher' => true]);
        $this->raw('involved_companies', 21, ['game' => 101, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $studio = Studio::where('igdb_id', 10)->first();

        $this->assertTrue($studio->published->contains($made));
        $this->assertFalse($studio->developed->contains($made));
        $this->assertTrue($studio->developed->contains($putOut));
        $this->assertSame(2, $studio->games_count);
    }

    /** Porting and support are real credits but not whose game it is. */
    public function test_porting_and_support_credits_are_not_written(): void
    {
        $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, ['name' => 'A Porting House', 'slug' => 'porting-house']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'porting' => true, 'supporting' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $this->assertSame(0, Studio::count());
    }

    /**
     * Of 56,911 studios with a game of ours, 35,633 have exactly one and most
     * of those have nothing written about them. They keep their page — the game
     * links to it — but they stay out of the sitemap.
     */
    public function test_a_thin_studio_exists_but_is_not_indexable(): void
    {
        $this->ourGame('One Game', 100);
        $this->ourGame('Another', 101);
        $this->ourGame('A Third', 102);

        $this->raw('companies', 10, ['name' => 'One Game Studio', 'slug' => 'one-game-studio']);
        $this->raw('companies', 11, ['name' => 'Two Game Studio', 'slug' => 'two-game-studio']);
        $this->raw('companies', 12, ['name' => 'Described Studio', 'slug' => 'described', 'description' => 'Known for things.']);

        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);
        $this->raw('involved_companies', 21, ['game' => 100, 'company' => 11, 'developer' => true]);
        $this->raw('involved_companies', 22, ['game' => 101, 'company' => 11, 'developer' => true]);
        $this->raw('involved_companies', 23, ['game' => 102, 'company' => 12, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $this->assertFalse(Studio::where('igdb_id', 10)->value('indexable'), 'one game, nothing written');
        $this->assertTrue(Studio::where('igdb_id', 11)->value('indexable'), 'two games');
        $this->assertTrue(Studio::where('igdb_id', 12)->value('indexable'), 'one game but described');

        $this->assertSame(3, Studio::count(), 'all three still exist');
    }

    /**
     * Their founding dates reach back past the epoch, and a few sit at the
     * proleptic zero — year 1 — which is their way of saying nothing.
     */
    public function test_a_nonsense_founding_date_becomes_null(): void
    {
        $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, ['name' => 'Ancient Studio', 'slug' => 'ancient', 'start_date' => -62135683200]);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $this->assertNull(Studio::where('igdb_id', 10)->value('founded'));
    }

    /**
     * The studio page has rendered "Part of" and "Studios under" since it was
     * built, and `parent_id` was null on all 56,911 rows — nothing ever filled
     * it. 1,946 companies name a parent.
     */
    public function test_a_studio_learns_who_owns_it(): void
    {
        $this->ourGame('Dishonored', 100);
        $this->ourGame('Some Other Game', 101);

        $this->raw('companies', 10, ['name' => 'Arkane Studios', 'slug' => 'arkane', 'parent' => 11]);
        $this->raw('companies', 11, ['name' => 'ZeniMax Media', 'slug' => 'zenimax']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);
        $this->raw('involved_companies', 21, ['game' => 101, 'company' => 11, 'publisher' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $arkane = Studio::where('igdb_id', 10)->first();
        $zenimax = Studio::where('igdb_id', 11)->first();

        $this->assertSame($zenimax->id, $arkane->parent_id);
        $this->assertTrue($zenimax->subsidiaries->contains($arkane));
    }

    /**
     * 1,698 defunct, 469 renamed, 374 merged. Their pages read as though they
     * were still working.
     */
    public function test_a_closed_studio_says_so(): void
    {
        $this->raw('company_statuses', 1, ['name' => 'defunct']);
        $this->raw('company_statuses', 3, ['name' => 'renamed']);

        $this->ourGame('Old Game', 100);
        $this->ourGame('New Game', 101);

        $this->raw('companies', 10, [
            'name' => 'Cygnus Software', 'slug' => 'cygnus',
            'status' => 3, 'change_date' => gmmktime(0, 0, 0, 1, 1, 1995), 'changed_company_id' => 11,
        ]);
        $this->raw('companies', 11, ['name' => 'The Successor', 'slug' => 'successor']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);
        $this->raw('involved_companies', 21, ['game' => 101, 'company' => 11, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $studio = Studio::where('igdb_id', 10)->first();

        $this->assertSame('renamed', $studio->status);
        $this->assertSame('1995-01-01', $studio->changed_at->toDateString());
        $this->assertSame('The Successor', $studio->became->name);

        $this->getJson('/api/v1/studios/cygnus')
            ->assertOk()
            ->assertJsonPath('data.status', 'renamed')
            ->assertJsonPath('data.became.slug', 'successor');
    }

    /** A company IGDB says nothing about is active, and says so plainly. */
    public function test_a_studio_with_no_status_is_recorded_as_active(): void
    {
        $this->ourGame('Dishonored', 100);
        $this->raw('companies', 10, ['name' => 'Arkane Studios', 'slug' => 'arkane', 'company_size' => 180]);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $studio = Studio::where('igdb_id', 10)->first();

        $this->assertSame('active', $studio->status);
        $this->assertSame(180, $studio->employees);
    }

    /** Without --apply it is a report and nothing more. */
    public function test_without_apply_nothing_is_written(): void
    {
        $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, ['name' => 'Arkane Studios', 'slug' => 'arkane-studios']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertSame(0, Studio::count());
    }

    /** Running it twice does not double the studios or the links. */
    public function test_a_second_run_changes_nothing(): void
    {
        $this->ourGame('Dishonored', 100);

        $this->raw('companies', 10, ['name' => 'Arkane Studios', 'slug' => 'arkane-studios']);
        $this->raw('involved_companies', 20, ['game' => 100, 'company' => 10, 'developer' => true]);

        $this->artisan('igdb:studios', ['--apply' => true]);
        $this->artisan('igdb:studios', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, Studio::count());
        $this->assertSame(1, DB::table('game_studio')->count());
    }
}
