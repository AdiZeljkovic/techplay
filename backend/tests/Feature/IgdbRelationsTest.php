<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * What a game is part of, and what is part of it.
 *
 * The case that shapes the whole table is the one where the other game is not
 * ours. Every IGDB game that names a parent is a type this catalogue does not
 * import — DLC, mods, packs, ports — so a rule requiring both ends to be here
 * meant a game could never list its own add-ons. The other side is a name, and
 * a link only when there is somewhere to link to.
 */
class IgdbRelationsTest extends TestCase
{
    use RefreshDatabase;

    private function raw(int $id, array $payload): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => 'games',
            'igdb_id' => $id,
            'payload' => json_encode($payload + ['id' => $id]),
            'fetched_at' => now(),
        ]);
    }

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

    /**
     * The point of the reshape: Hades lists its soundtrack whether or not the
     * soundtrack has a page. 17,580 pieces of DLC belong to games we hold and
     * none of them is imported as a page.
     */
    public function test_a_game_lists_dlc_we_do_not_carry(): void
    {
        $hades = $this->ourGame('Hades', 100);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Original Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', [
            'game_id' => $hades->id,
            'relation' => 'has_dlc',
            'other_name' => 'Hades Original Soundtrack',
            'other_game_id' => null,
        ]);

        $this->getJson('/api/v1/games/hades')
            ->assertOk()
            ->assertJsonPath('related.DLC.0.name', 'Hades Original Soundtrack')
            ->assertJsonPath('related.DLC.0.slug', null);
    }

    /** When we do carry it, the same row becomes a link. */
    public function test_the_other_side_becomes_a_link_when_we_have_it(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->getJson('/api/v1/games/hades')
            ->assertOk()
            ->assertJsonPath('related.DLC.0.slug', 'hades-soundtrack');
    }

    /** Each side gets its own row, and each says the fact its own way. */
    public function test_each_side_reads_the_fact_from_its_own_side(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true]);

        $this->getJson('/api/v1/games/hades-soundtrack')
            ->assertOk()
            ->assertJsonPath('related.DLC for.0.name', 'Hades');

        $this->getJson('/api/v1/games/hades')
            ->assertOk()
            ->assertJsonPath('related.DLC.0.name', 'Hades Soundtrack');
    }

    /**
     * `parent_game` is not "this is DLC".
     *
     * It is IGDB's general "derived from", set on DLC, remasters, ports and
     * episodes alike — and taking it to mean DLC put "DLC for Metroid Prime"
     * on the Metroid Prime Remastered page, beside the correct "Remaster of"
     * line. What it means is on the child's `game_type`.
     */
    public function test_a_parent_pointer_is_named_by_what_the_child_is(): void
    {
        $this->ourGame('Metroid Prime', 100);
        $this->ourGame('Metroid Prime Remastered', 101);

        $this->raw(100, ['name' => 'Metroid Prime', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Metroid Prime Remastered', 'game_type' => 9, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', ['relation' => 'remaster_of']);
        $this->assertDatabaseHas('game_relations', ['relation' => 'remastered_as']);
        $this->assertDatabaseMissing('game_relations', ['relation' => 'dlc_of']);
    }

    /** Both statements of one fact make one row per side, never two per side. */
    public function test_a_fact_stated_from_both_ends_is_not_written_twice(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0, 'dlcs' => [101]]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(2, DB::table('game_relations')->count(), 'one row per side, no more');
    }

    /** A relation where neither game is ours belongs on nobody's page. */
    public function test_a_relation_between_two_games_we_do_not_have_is_dropped(): void
    {
        $this->ourGame('Something Else', 100);

        $this->raw(100, ['name' => 'Something Else', 'game_type' => 0]);
        $this->raw(200, ['name' => 'Their Game', 'game_type' => 0]);
        $this->raw(201, ['name' => 'Their DLC', 'game_type' => 1, 'parent_game' => 200]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(0, DB::table('game_relations')->count());
    }

    /** Remaster, port and bundle are separate facts with separate words. */
    public function test_the_kinds_are_kept_apart(): void
    {
        $this->ourGame('Original', 100);
        $this->ourGame('The Remaster', 101);
        $this->ourGame('The Port', 102);

        $this->raw(100, ['name' => 'Original', 'game_type' => 0, 'remasters' => [101], 'ports' => [102]]);
        $this->raw(101, ['name' => 'The Remaster', 'game_type' => 9]);
        $this->raw(102, ['name' => 'The Port', 'game_type' => 11]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', ['relation' => 'remastered_as']);
        $this->assertDatabaseHas('game_relations', ['relation' => 'ported_as']);
    }

    /** The ones a reader can click lead the shelf. */
    public function test_the_ones_with_a_page_come_first(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Carried DLC', 102);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Uncarried DLC', 'game_type' => 1, 'parent_game' => 100]);
        $this->raw(102, ['name' => 'Carried DLC', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true]);

        $this->getJson('/api/v1/games/hades')
            ->assertOk()
            ->assertJsonPath('related.DLC.0.name', 'Carried DLC');
    }

    /** A game does not relate to itself, however IGDB spells it. */
    public function test_a_game_is_not_related_to_itself(): void
    {
        $this->ourGame('Odd Game', 100);
        $this->raw(100, ['name' => 'Odd Game', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(0, DB::table('game_relations')->count());
    }

    /**
     * The shape of a field must not depend on whether there is anything in it.
     * PHP's empty array encodes as `[]`, so these were objects on games with
     * relations and arrays on games without.
     */
    public function test_the_keyed_fields_stay_objects_when_empty(): void
    {
        $this->ourGame('Lonely Game', 100);
        $this->raw(100, ['name' => 'Lonely Game', 'game_type' => 0]);

        $body = $this->getJson('/api/v1/games/lonely-game')->assertOk()->getContent();

        $this->assertStringContainsString('"related":{}', $body);
        $this->assertStringContainsString('"links":{}', $body);
    }

    public function test_without_apply_nothing_is_written(): void
    {
        $this->ourGame('Hades', 100);
        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertSame(0, DB::table('game_relations')->count());
    }

    /** Running it twice does not double anything. */
    public function test_a_second_run_adds_nothing(): void
    {
        $this->ourGame('Hades', 100);
        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true]);
        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('game_relations')->count());
    }
}
