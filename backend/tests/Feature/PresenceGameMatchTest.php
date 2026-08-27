<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Services\PresenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What a storefront calls a game, and what the catalogue calls it.
 *
 * Steam reports the title printed on the store page — "Metro: Last Light
 * Complete Edition" — while the catalogue holds "Metro: Last Light". The
 * lookup asked for an exact name or an exact slug, got neither, and stored the
 * presence with a null game_id. Nothing threw: the row was there, the name was
 * right, and every consequence was silent. No session banked, no taste signal
 * recorded, no link to the game.
 */
class PresenceGameMatchTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $name, string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => $name,
            'released' => '2013-05-14',
            'genres' => ['Shooter'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function seen(string $reported): ?int
    {
        $user = User::factory()->create();

        return app(PresenceService::class)->set($user, $reported, 'steam')->game_id;
    }

    public function test_an_exact_title_still_matches(): void
    {
        $game = $this->game('Metro: Last Light', 'metro-last-light');

        $this->assertSame($game->id, $this->seen('Metro: Last Light'));
    }

    public function test_a_packaging_suffix_does_not_lose_the_game(): void
    {
        $game = $this->game('Metro: Last Light', 'metro-last-light');

        // The exact title Steam reported for the account that surfaced this.
        $this->assertSame($game->id, $this->seen('Metro: Last Light Complete Edition'));
    }

    public function test_case_alone_is_not_a_reason_to_miss(): void
    {
        $game = $this->game('Metro: Last Light', 'metro-last-light');

        $this->assertSame($game->id, $this->seen('METRO: LAST LIGHT'));
    }

    /**
     * The rule that keeps the stripping safe: a distinct edition is matched
     * whole, before anything is trimmed off it.
     */
    public function test_a_separate_edition_is_not_folded_into_its_base_game(): void
    {
        $base = $this->game('Metro 2033', 'metro-2033');
        $redux = $this->game('Metro 2033: Redux', 'metro-2033-redux');

        $this->assertSame($redux->id, $this->seen('Metro 2033: Redux'));
        $this->assertSame($base->id, $this->seen('Metro 2033'));
    }

    public function test_a_title_in_no_catalogue_is_recorded_by_name_alone(): void
    {
        $user = User::factory()->create();

        $presence = app(PresenceService::class)->set($user, 'Some Unlisted Indie', 'steam');

        // Still worth storing — the profile can say what they are playing even
        // when the catalogue cannot say which game it is.
        $this->assertNull($presence->game_id);
        $this->assertSame('Some Unlisted Indie', $presence->game_name);
        $this->assertTrue((bool) $presence->is_active);
    }
}
