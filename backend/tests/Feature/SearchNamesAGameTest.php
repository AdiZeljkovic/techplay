<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Somebody typing four letters into a search box is naming a game.
 *
 * The suggestion endpoint sorted on rating alone, so every title containing the
 * typed word competed on equal footing and the best-reviewed one won. Typing
 * "Half" offered Rise of the Half Moon, Dragon Half and a game called Half —
 * while the catalogue's own list endpoint, asked the same thing, returned
 * Half-Life first. The dropdown looked broken because it answered a question
 * nobody had asked.
 */
class SearchNamesAGameTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $name, float $rating, ?string $description = 'A game.'): Game
    {
        return Game::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(5),
            'rating' => $rating,
            'description' => $description,
        ]);
    }

    #[Test]
    public function a_title_that_begins_with_the_word_comes_before_one_that_merely_contains_it(): void
    {
        // Deliberately rated above everything else: under the old ordering it
        // won on rating and this is the case that has to stop.
        $this->game('Rise of the Half Moon: January', 9.9);
        $this->game('Dragon Half', 9.5);
        $this->game('Half-Life', 8.7);

        $names = collect($this->getJson('/api/v1/search/games?q=Half')->json('results'))
            ->pluck('title')
            ->all();

        $this->assertSame('Half-Life', $names[0] ?? null,
            'a game whose name starts with the word lost to one that only contains it');
    }

    /**
     * Rating still decides between titles that match equally well — which is
     * what puts a well-known series above an obscure game named exactly the
     * search term.
     */
    #[Test]
    public function rating_breaks_a_tie_between_equally_good_matches(): void
    {
        $this->game('Half', 4.1);
        $this->game('Half-Life', 8.7);

        $names = collect($this->getJson('/api/v1/search/games?q=Half')->json('results'))
            ->pluck('title')
            ->all();

        $this->assertSame(['Half-Life', 'Half'], $names);
    }

    #[Test]
    public function a_game_with_no_description_is_never_suggested(): void
    {
        $this->game('Halfling', 9.9, description: null);
        $this->game('Half-Life', 8.7);

        $names = collect($this->getJson('/api/v1/search/games?q=Half')->json('results'))
            ->pluck('title')
            ->all();

        $this->assertSame(['Half-Life'], $names);
    }

    /**
     * Most of the catalogue has no rating, and `ORDER BY rating DESC` puts NULL
     * first in Postgres — so the tie-break handed every position to games
     * nobody has scored. This is the case that shipped: four unrated titles
     * above Half-Life, from a query that had just been "fixed".
     */
    #[Test]
    public function an_unrated_game_never_outranks_a_rated_one(): void
    {
        Game::create(['name' => 'Half Minute Hero', 'slug' => 'hmh', 'description' => 'A game.', 'rating' => null]);
        Game::create(['name' => 'Halfbrick Rocket Racing', 'slug' => 'hrr', 'description' => 'A game.', 'rating' => null]);
        $this->game('Half-Life', 7.7);

        $names = collect($this->getJson('/api/v1/search/games?q=Half')->json('results'))
            ->pluck('title')
            ->all();

        $this->assertSame('Half-Life', $names[0] ?? null,
            'a game nobody has rated came before one that is rated 7.7');
    }

    /** Two characters is the floor; one would scan the whole catalogue. */
    #[Test]
    public function a_single_letter_is_refused(): void
    {
        $this->getJson('/api/v1/search/games?q=H')->assertStatus(422);
    }
}
