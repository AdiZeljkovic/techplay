<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * A game that has been removed says so, permanently, and keeps saying it.
 *
 * A 404 means "maybe temporary" and Google comes back for months. A 410 means
 * "gone on purpose" and it stops. On a site whose crawl budget is the binding
 * constraint — 77 game pages a day against a catalogue of 295,000 — that
 * difference is a quarter of what little there is.
 *
 * Two halves had to hold and only one did. The API answered 410 from the
 * tombstone, correctly, since the adult purge. But the tombstone was written
 * by the two purge commands and by nothing else, so every other way a game
 * left — the 08/2026 catalogue rebuild, a merge, a delete from the admin —
 * left Google holding a URL nothing would ever call permanently gone. Of the
 * 129 dead game URLs Googlebot asked for in the first week of September, 53
 * had no tombstone at all.
 */
class DeletedGamesAnswerGoneTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug = 'a-game-to-remove'): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => 'A Game To Remove',
            'description' => str_repeat('A real description, long enough to be indexable. ', 4),
            'released' => '2020-01-01',
            'genres' => ['Action'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    public function test_deleting_a_game_leaves_a_tombstone(): void
    {
        $game = $this->game();

        $game->delete();

        $stone = DB::table('game_tombstones')->where('slug', 'a-game-to-remove')->first();

        $this->assertNotNull($stone, 'A deleted game left no record that it had ever existed.');
        $this->assertSame('A Game To Remove', $stone->name);
    }

    /** And the API says gone rather than missing. */
    public function test_the_api_answers_410_for_a_removed_game(): void
    {
        $game = $this->game();
        $game->delete();

        $this->getJson('/api/v1/games/a-game-to-remove')->assertStatus(410);
    }

    /** A slug that never existed is missing, not gone. */
    public function test_a_slug_that_never_existed_is_still_a_404(): void
    {
        $this->getJson('/api/v1/games/this-was-never-a-game')->assertStatus(404);
    }

    /**
     * A game removed and later re-added does not collide on its own slug.
     *
     * The tombstone is unique on slug, so a second removal has to update the
     * row rather than insert beside it — otherwise the second delete throws
     * and takes whatever was deleting it down with it.
     */
    public function test_a_game_can_be_removed_twice(): void
    {
        $this->game()->delete();
        $this->game()->delete();

        $this->assertSame(1, DB::table('game_tombstones')->where('slug', 'a-game-to-remove')->count());
    }

    /**
     * The nginx map is built from the tombstones, and skips nothing it should carry.
     *
     * nginx answers these directly — 61,000 dead URLs rendered through Next to
     * produce a 404 page nobody reads is a waste on both sides — so the map is
     * the thing that actually reaches a crawler. It is generated rather than
     * maintained, and this is the check that it contains what it should.
     */
    public function test_the_map_carries_every_safe_slug(): void
    {
        $this->game('safe-slug')->delete();
        $this->game('AN.ODD_one-99')->delete();

        // Not a slug any part of this site produces, but a map entry that
        // needed quoting would be a map entry that breaks the whole server.
        DB::table('game_tombstones')->insert([
            'slug' => 'a slug with spaces',
            'name' => 'Trouble',
            'reason' => 'test',
            'deleted_at' => now(),
        ]);

        $dir = storage_path('framework/testing/nginx-map');
        $this->artisan('games:gone-map', ['--path' => $dir])->assertSuccessful();

        $map = file_get_contents($dir.'/techplay-gone-games.conf');

        $this->assertStringContainsString('/games/safe-slug 1;', $map);
        $this->assertStringContainsString('/games/AN.ODD_one-99 1;', $map);
        $this->assertStringNotContainsString('a slug with spaces', $map);

        // Without these nginx refuses to start at sixty thousand entries.
        $this->assertStringContainsString('map_hash_max_size', $map);
        $this->assertStringContainsString('map_hash_bucket_size 128;', $map);

        // A map with no default lets nothing through.
        $this->assertStringContainsString('default 0;', $map);
    }
}
