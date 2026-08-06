<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameMatchDecision;
use App\Models\GameStoreLink;
use App\Services\Releases\GameMerger;
use App\Services\Releases\TitleNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameMergerTest extends TestCase
{
    use RefreshDatabase;

    private TitleNormalizer $normalizer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->normalizer = new TitleNormalizer;
    }

    /** A calendar entry as one store's sync would have created it. */
    private function entry(string $store, string $title, array $attrs = []): Game
    {
        static $n = 0;
        $n++;

        $game = Game::create(array_merge([
            'slug' => 'game-'.$n,
            'name' => $title,
            'match_key' => $this->normalizer->key($title),
            'released' => '2026-09-04',
            'release_precision' => 'day',
            'cover_url' => "https://{$store}.example/hero.jpg",
            'platforms' => [ucfirst($store)],
            'genres' => ['Action'],
            'screenshots' => ['a.jpg'],
            'description' => 'A game.',
            'publishers' => ['Team Cherry'],
        ], $attrs));

        GameStoreLink::create([
            'game_id' => $game->id,
            'store' => $store,
            'store_id' => $store.'-'.$n,
        ]);

        return $game;
    }

    private function merge(): array
    {
        return app(GameMerger::class)->run();
    }

    public function test_one_game_from_three_stores_becomes_one_entry(): void
    {
        $this->entry('steam', 'Hollow Knight: Silksong', ['platforms' => ['PC']]);
        $this->entry('xbox', 'Hollow Knight: Silksong', ['platforms' => ['Xbox Series X|S']]);
        $this->entry('nintendo', 'Hollow Knight: Silksong', ['platforms' => ['Nintendo Switch']]);

        $this->merge();

        $this->assertSame(1, Game::count());

        // The whole point: the entry now tells the truth about where it lands.
        $this->assertSame(
            ['PC', 'Xbox Series X|S', 'Nintendo Switch'],
            Game::first()->platforms,
        );

        // And every store still points at it.
        $this->assertSame(3, GameStoreLink::where('game_id', Game::first()->id)->count());
    }

    public function test_store_spellings_of_one_title_are_recognised(): void
    {
        $this->entry('steam', 'Lies of P: Complete Edition');
        $this->entry('nintendo', 'Lies of P – Complete Edition (PS5)');

        $this->assertSame(1, $this->merge()['merged']);
        $this->assertSame(1, Game::count());
    }

    public function test_the_fuller_record_wins_field_by_field(): void
    {
        $this->entry('nintendo', 'Silksong', [
            'description' => 'Short.',
            'screenshots' => [],
            'genres' => ['Platformer'],
        ]);

        $this->entry('steam', 'Silksong', [
            'description' => str_repeat('A much fuller write-up. ', 10),
            'screenshots' => ['a.jpg', 'b.jpg', 'c.jpg'],
            'genres' => ['Action'],
        ]);

        $this->merge();

        $game = Game::first();
        $this->assertStringContainsString('much fuller', $game->description);
        $this->assertCount(3, $game->screenshots);
        $this->assertSame(['Platformer', 'Action'], $game->genres, 'genres union rather than replace');
    }

    public function test_the_game_keeps_its_own_name_not_an_editions(): void
    {
        // Sony's pre-orders are largely Ultimate and Deluxe editions, so
        // without this the calendar announces "NASCAR 26 Gold Edition".
        $this->entry('playstation', 'NASCAR 26 Gold Edition');
        $this->entry('steam', 'NASCAR 26');

        $this->merge();

        $this->assertSame('NASCAR 26', Game::first()->name);
    }

    public function test_art_is_chosen_by_store_not_by_whichever_ran_last(): void
    {
        // hero_priority puts steam first, so the Steam header wins even though
        // the Nintendo row is older.
        $this->entry('nintendo', 'Silksong');
        $this->entry('steam', 'Silksong');

        $this->merge();

        $this->assertSame('https://steam.example/hero.jpg', Game::first()->cover_url);
    }

    public function test_the_earliest_date_wins_when_stores_disagree(): void
    {
        $this->entry('steam', 'Silksong', ['released' => '2026-09-06']);
        $this->entry('xbox', 'Silksong', ['released' => '2026-09-04']);

        $this->merge();

        $this->assertSame('2026-09-04', Game::first()->released->toDateString());
    }

    public function test_two_products_in_one_store_are_never_merged(): void
    {
        // Steam sells a game and its deluxe edition as separate things.
        $this->entry('steam', 'Silksong');
        $this->entry('steam', 'Silksong');

        $this->merge();

        $this->assertSame(2, Game::count());
    }

    public function test_a_remaster_years_later_survives_the_merge(): void
    {
        $this->entry('steam', 'Lies of P', ['released' => '2026-08-10']);
        $this->entry('xbox', 'Lies of P', ['released' => '2027-03-10']);

        $tally = $this->merge();

        $this->assertSame(0, $tally['merged']);
        $this->assertSame(2, Game::count(), 'a port is its own entry');
    }

    public function test_a_pair_too_close_to_call_waits_for_an_editor(): void
    {
        $this->entry('steam', 'Outcasts Reborn', ['released' => '2026-08-10']);
        $this->entry('xbox', 'Outcast Reborn', ['released' => '2026-08-12']);

        $tally = $this->merge();

        $this->assertSame(1, $tally['review']);
        $this->assertSame(2, Game::count(), 'nothing is fused on a hunch');
    }

    public function test_an_editors_ruling_is_obeyed(): void
    {
        GameMatchDecision::create([
            'left_key' => 'silksong',
            'right_key' => 'silksong',
            'same_game' => false,
        ]);

        $this->entry('steam', 'Silksong');
        $this->entry('xbox', 'Silksong');

        $this->merge();

        $this->assertSame(2, Game::count(), 'the editor said these are different');
    }

    public function test_a_locked_field_is_not_overwritten_by_a_merge(): void
    {
        $keep = $this->entry('steam', 'Silksong', [
            'released' => '2026-09-20',
            'locked_fields' => ['released'],
        ]);

        $this->entry('xbox', 'Silksong', ['released' => '2026-09-04']);

        $this->merge();

        $this->assertSame('2026-09-20', $keep->fresh()->released->toDateString());
    }

    public function test_the_archive_is_left_out_of_it(): void
    {
        // 200k historical rows carry no match_key and must never be candidates.
        Game::create(['slug' => 'old-game', 'name' => 'Silksong', 'released' => '2026-09-04']);

        $this->entry('steam', 'Silksong');
        $this->entry('xbox', 'Silksong');

        $this->merge();

        $this->assertSame(2, Game::count(), 'one merged pair, plus the untouched archive row');
        $this->assertNotNull(Game::where('slug', 'old-game')->first());
    }

    public function test_merging_is_safe_to_run_twice(): void
    {
        $this->entry('steam', 'Silksong');
        $this->entry('xbox', 'Silksong');
        $this->entry('nintendo', 'Silksong');

        $this->merge();
        $this->merge();

        $this->assertSame(1, Game::count());
        $this->assertSame(3, GameStoreLink::count());
    }
}
