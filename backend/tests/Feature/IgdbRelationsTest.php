<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * What a game is part of.
 *
 * IGDB states these from both ends — a game lists its `dlcs`, and each of those
 * names it back as `parent_game` — so the thing worth pinning is that both
 * statements land on one row. Two rows saying the same thing is two rows that
 * can disagree after the next import.
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

    public function test_a_dlc_learns_which_game_it_belongs_to(): void
    {
        $base = $this->ourGame('Hades', 100);
        $dlc = $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', [
            'game_id' => $dlc->id, 'related_game_id' => $base->id, 'relation' => 'dlc_of',
        ]);
    }

    /**
     * Both ends state it. One row is the answer — the other statement must
     * land on the same row rather than beside it.
     */
    public function test_both_directions_of_the_same_fact_make_one_row(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0, 'dlcs' => [101]]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('game_relations')->count());
    }

    /**
     * `parent_game` is not "this is DLC".
     *
     * It is IGDB's general "derived from", set on DLC, remasters, ports and
     * expansions alike — and taking it to mean DLC put "DLC for Metroid Prime"
     * on the Metroid Prime Remastered page, beside the correct "Remaster of"
     * line that came from the other end of the same fact. What it means is on
     * the child's `game_type`.
     */
    public function test_a_parent_pointer_is_named_by_what_the_child_is(): void
    {
        $this->ourGame('Metroid Prime', 100);
        $this->ourGame('Metroid Prime Remastered', 101);

        $this->raw(100, ['name' => 'Metroid Prime', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Metroid Prime Remastered', 'game_type' => 9, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', ['relation' => 'remaster_of']);
        $this->assertDatabaseMissing('game_relations', ['relation' => 'dlc_of']);
        $this->assertSame(1, DB::table('game_relations')->count());
    }

    /** A relation to a game we do not carry is a link nobody could follow. */
    public function test_a_relation_to_a_game_we_do_not_have_is_dropped(): void
    {
        $this->ourGame('Hades', 100);

        $this->raw(100, ['name' => 'Hades', 'dlcs' => [999]]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(0, DB::table('game_relations')->count());
    }

    /** Remaster, port and bundle are separate facts with separate words. */
    public function test_the_kinds_are_kept_apart(): void
    {
        $this->ourGame('Original', 100);
        $this->ourGame('The Remaster', 101);
        $this->ourGame('The Port', 102);

        $this->raw(100, ['name' => 'Original', 'remasters' => [101], 'ports' => [102]]);
        $this->raw(101, ['name' => 'The Remaster']);
        $this->raw(102, ['name' => 'The Port']);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_relations', ['relation' => 'remaster_of']);
        $this->assertDatabaseHas('game_relations', ['relation' => 'port_of']);
    }

    /**
     * The same row reads differently from each end: "DLC for Hades" on the
     * add-on's page, "DLC" on Hades' own.
     */
    public function test_the_page_reads_the_row_from_both_ends(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);

        $this->raw(100, ['name' => 'Hades', 'game_type' => 0]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'game_type' => 1, 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true]);

        $this->getJson('/api/v1/games/hades-soundtrack')
            ->assertOk()
            ->assertJsonPath('part_of.DLC for.0.name', 'Hades');

        $this->getJson('/api/v1/games/hades')
            ->assertOk()
            ->assertJsonPath('parts.DLC.0.name', 'Hades Soundtrack');
    }

    /**
     * The shape of a field must not depend on whether there is anything in it.
     * PHP's empty array encodes as `[]`, so these three were objects on games
     * with relations and arrays on games without.
     */
    public function test_the_keyed_fields_stay_objects_when_empty(): void
    {
        $this->ourGame('Lonely Game', 100);
        $this->raw(100, ['name' => 'Lonely Game']);

        $body = $this->getJson('/api/v1/games/lonely-game')->assertOk()->getContent();

        $this->assertStringContainsString('"part_of":{}', $body);
        $this->assertStringContainsString('"parts":{}', $body);
        $this->assertStringContainsString('"links":{}', $body);
    }

    /** A game does not relate to itself, however IGDB spells it. */
    public function test_a_game_is_not_related_to_itself(): void
    {
        $this->ourGame('Odd Game', 100);
        $this->raw(100, ['name' => 'Odd Game', 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(0, DB::table('game_relations')->count());
    }

    public function test_without_apply_nothing_is_written(): void
    {
        $this->ourGame('Hades', 100);
        $this->ourGame('Hades Soundtrack', 101);
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
        $this->ourGame('Hades Soundtrack', 101);
        $this->raw(100, ['name' => 'Hades', 'dlcs' => [101]]);
        $this->raw(101, ['name' => 'Hades Soundtrack', 'parent_game' => 100]);

        $this->artisan('igdb:relations', ['--apply' => true]);
        $this->artisan('igdb:relations', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('game_relations')->count());
    }
}
