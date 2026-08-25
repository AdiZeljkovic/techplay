<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Services\ContentGameLinker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Which game a headline is about.
 *
 * On 26 Aug 2026 nobody could publish an article. The form blamed nothing in
 * particular, so the publish date — visibly a few minutes in the past by the
 * time anyone finished writing — took the blame. The log said otherwise:
 *
 *     Allowed memory size of 134217728 bytes exhausted
 *     at app/Services/ContentGameLinker.php:123
 *
 * That line built an index of every "notable" game in the catalogue, in one
 * PHP array, on every save. The filter had stopped filtering: its dominant
 * term was `views > 0`, which was a fair proxy for notability when the
 * traffic was people and meant "a crawler opened this page" by August —
 * 303,399 rows of 332,455. Three hundred thousand names in memory, per save.
 *
 * The lookup goes the other way now: the phrases in the headline are the
 * query, and the catalogue is an index. These tests hold the behaviour that
 * mattered while that changed.
 */
class ContentGameLinkerTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $name, ?string $released = '2015-05-19', array $extra = []): Game
    {
        return Game::create(array_merge([
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 999999),
            'name' => $name,
            'released' => $released,
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ], $extra));
    }

    private function linker(): ContentGameLinker
    {
        return app(ContentGameLinker::class);
    }

    public function test_it_finds_the_game_named_in_a_headline(): void
    {
        $witcher = $this->game('The Witcher 3: Wild Hunt');

        $id = $this->linker()->match(null, 'The Witcher 3: Wild Hunt Remastered announced at Opening Night Live');

        $this->assertSame($witcher->id, $id);
    }

    public function test_the_longest_name_wins(): void
    {
        $this->game('The Witcher');
        $wildHunt = $this->game('The Witcher 3: Wild Hunt');

        // Both names are inside the headline; only one of them is the subject.
        $id = $this->linker()->match(null, 'Revisiting The Witcher 3: Wild Hunt ten years on');

        $this->assertSame($wildHunt->id, $id);
    }

    public function test_a_sequel_we_do_not_have_links_nothing(): void
    {
        $this->game('The Witcher');

        // "The Witcher 4" contains "The Witcher", and is not it.
        $this->assertNull($this->linker()->match(null, 'The Witcher 4 gets a teaser'));
    }

    public function test_single_words_in_a_headline_are_left_alone(): void
    {
        $this->game('Control');
        $this->game('Limbo');

        // Both are real games and both are English. A headline is not a
        // reference to a game just because a word appears in it.
        $this->assertNull($this->linker()->match(null, 'The studio was left in development limbo'));
        $this->assertNull($this->linker()->match(null, 'Sony takes control of the situation'));
    }

    public function test_an_editor_may_declare_a_single_word_title(): void
    {
        $control = $this->game('Control');

        // Typed on purpose in the review form, so it is trusted where a
        // headline would not be.
        $this->assertSame($control->id, $this->linker()->match('Control', 'A review'));
    }

    public function test_a_remake_is_told_from_the_original_by_the_publish_year(): void
    {
        $original = $this->game('Silent Hill 2', '2001-09-24');
        $remake = $this->game('Silent Hill 2', '2024-10-08');

        $this->assertSame($remake->id, $this->linker()->match(null, 'Silent Hill 2 review', 2024));
        $this->assertSame($original->id, $this->linker()->match(null, 'Silent Hill 2 retrospective', 2002));
    }

    public function test_a_rated_game_outranks_an_obscure_row_of_the_same_name(): void
    {
        $obscure = $this->game('Dead Space', '1994-01-01');
        $known = $this->game('Dead Space', '2008-10-13', ['rating' => 8.9]);

        // Notability used to be a `where` that excluded rows outright, resting
        // on a view counter that crawlers had made meaningless. It orders the
        // claimants now instead of hiding them.
        $this->assertContains($this->linker()->match(null, 'Dead Space is still terrifying'), [$known->id, $obscure->id]);
        $this->assertSame($known->id, $this->linker()->match(null, 'Dead Space is still terrifying'));
    }

    public function test_a_headline_naming_nothing_links_nothing(): void
    {
        $this->game('The Witcher 3: Wild Hunt');

        $this->assertNull($this->linker()->match(null, 'Five things we learned this week'));
    }

    public function test_matching_does_not_read_the_whole_catalogue(): void
    {
        for ($i = 0; $i < 40; $i++) {
            $this->game("Filler Title Number {$i}");
        }

        $this->game('The Witcher 3: Wild Hunt');

        DB::enableQueryLog();
        $this->linker()->match(null, 'The Witcher 3: Wild Hunt Remastered announced');
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // One lookup, whatever the catalogue holds. The old implementation
        // read every notable row on every call, which is what exhausted the
        // memory limit on a table of 332,455.
        $this->assertLessThanOrEqual(2, count($queries));

        foreach ($queries as $query) {
            $this->assertStringNotContainsString('select * from "games"', $query['query']);
        }
    }

    public function test_the_stored_key_follows_a_renamed_game(): void
    {
        $game = $this->game('Wrong Name Entirely');

        $game->update(['name' => 'The Witcher 3: Wild Hunt']);

        // Four different writers set games.name; a key they each have to
        // remember to update is a key that drifts.
        $this->assertSame($game->id, $this->linker()->match(null, 'The Witcher 3: Wild Hunt gets a patch'));
    }
}
