<?php

namespace Tests\Feature;

use App\Jobs\RefreshShelfPrices;
use App\Models\Game;
use App\Models\GameExternalId;
use App\Models\GamePrice;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GogService;
use App\Services\ProfileService;
use App\Services\SteamPriceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * What a shelf is worth, and what it admits it does not know.
 *
 * Full price rather than today's, so a library does not lose sixty dollars
 * because four of its games are on sale this week and get it back on Monday.
 * And a game with no price is counted as unpriced rather than as zero: the
 * catalogue holds free-to-play titles and games withdrawn from sale — GTA V
 * answers Steam with nothing today and sits on real shelves — and a total that
 * silently treats those as worthless understates itself without saying so.
 */
class ShelfWorthTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug, string $name = 'A Game'): Game
    {
        return Game::create([
            'slug' => $slug, 'name' => $name, 'released' => '2020-01-01',
            'genres' => ['RPG'], 'platforms' => ['PC'], 'tags' => [],
        ]);
    }

    private function shelve(User $u, Game $g, string $status = 'backlog'): void
    {
        UserGame::create(['user_id' => $u->id, 'game_id' => $g->id, 'status' => $status]);
    }

    private function price(Game $g, array $attrs): void
    {
        GamePrice::create($attrs + [
            'game_id' => $g->id, 'currency' => 'USD', 'source' => 'steam', 'fetched_at' => now(),
        ]);
    }

    // ── the sum ─────────────────────────────────────────────────────────────

    #[Test]
    public function a_shelf_is_worth_its_games_at_full_price(): void
    {
        $user = User::factory()->create();

        $a = $this->game('a');
        $this->shelve($user, $a);
        $b = $this->game('b');
        $this->shelve($user, $b);

        $this->price($a, ['status' => 'priced', 'full_cents' => 5999, 'final_cents' => 2999, 'discount_percent' => 50]);
        $this->price($b, ['status' => 'priced', 'full_cents' => 1999, 'final_cents' => 1999]);

        $worth = app(ProfileService::class)->shelfWorth($user);

        // Full price: 59.99 + 19.99. A sale does not make the library worth less.
        $this->assertSame(7998, $worth['full_cents']);
        // And what it would cost today, for "on sale now".
        $this->assertSame(4998, $worth['on_sale_cents']);
        $this->assertSame(2, $worth['priced']);
        $this->assertSame(0, $worth['unpriced']);
    }

    /**
     * The distinction the whole thing rests on.
     */
    #[Test]
    public function a_game_with_no_price_is_counted_as_unpriced_not_as_zero(): void
    {
        $user = User::factory()->create();

        $paid = $this->game('paid');
        $this->shelve($user, $paid);
        $free = $this->game('free');
        $this->shelve($user, $free);
        $gone = $this->game('gone');
        $this->shelve($user, $gone);
        $never = $this->game('never');
        $this->shelve($user, $never);   // never fetched at all

        $this->price($paid, ['status' => 'priced', 'full_cents' => 4000, 'final_cents' => 4000]);
        $this->price($free, ['status' => 'free', 'full_cents' => 0, 'final_cents' => 0]);
        $this->price($gone, ['status' => 'unavailable', 'full_cents' => null, 'final_cents' => null]);

        $worth = app(ProfileService::class)->shelfWorth($user);

        $this->assertSame(4000, $worth['full_cents']);
        // Free-to-play is a real answer and counts as priced; withdrawn and
        // never-asked are not, and are reported rather than absorbed.
        $this->assertSame(2, $worth['priced'], 'the paid one and the free one');
        $this->assertSame(2, $worth['unpriced'], 'the withdrawn one and the unasked one');
    }

    /**
     * You do not own a wishlist.
     */
    #[Test]
    public function a_wishlisted_game_is_not_part_of_what_you_own(): void
    {
        $user = User::factory()->create();

        $owned = $this->game('owned');
        $this->shelve($user, $owned, 'played');
        $wanted = $this->game('wanted');
        $this->shelve($user, $wanted, 'wishlist');

        $this->price($owned, ['status' => 'priced', 'full_cents' => 3000, 'final_cents' => 3000]);
        $this->price($wanted, ['status' => 'priced', 'full_cents' => 9900, 'final_cents' => 9900]);

        $this->assertSame(3000, app(ProfileService::class)->shelfWorth($user)['full_cents']);
    }

    // ── fetching ────────────────────────────────────────────────────────────

    /**
     * `initial` is the pre-sale price, and it is the one that is stored.
     */
    #[Test]
    public function the_price_taken_from_steam_is_the_one_before_the_discount(): void
    {
        Http::fake(['*appdetails*' => Http::response([
            '49520' => ['success' => true, 'data' => ['price_overview' => [
                'currency' => 'USD', 'initial' => 1999, 'final' => 499, 'discount_percent' => 75,
            ]]],
        ])]);

        $prices = app(SteamPriceService::class)->pricesFor([49520]);

        $this->assertSame('priced', $prices[49520]['status']);
        $this->assertSame(1999, $prices[49520]['full']);
        $this->assertSame(499, $prices[49520]['final']);
    }

    /**
     * Steam answering "no" is not the same as a game costing nothing.
     */
    #[Test]
    public function a_delisted_game_is_unavailable_and_a_free_one_is_free(): void
    {
        Http::fake(['*appdetails*' => Http::response([
            '271590' => ['success' => false],                       // withdrawn
            '570' => ['success' => true, 'data' => []],             // free to play
        ])]);

        $prices = app(SteamPriceService::class)->pricesFor([271590, 570]);

        $this->assertSame('unavailable', $prices[271590]['status']);
        $this->assertNull($prices[271590]['full']);
        $this->assertSame('free', $prices[570]['status']);
        $this->assertSame(0, $prices[570]['full']);
    }

    /**
     * A game that came from Epic or GOG has no Steam id until somebody looks it
     * up — and the id is kept, so it is looked up exactly once.
     */
    #[Test]
    public function a_game_from_another_store_is_found_by_name_and_its_id_kept(): void
    {
        $user = User::factory()->create();
        $game = $this->game('borderlands-2', 'Borderlands 2');
        $this->shelve($user, $game);

        Http::fake([
            '*storesearch*' => Http::response(['items' => [
                ['id' => 49520, 'name' => 'Borderlands 2', 'price' => ['currency' => 'USD', 'initial' => 1999, 'final' => 1999, 'discount_percent' => 0]],
            ]]),
            '*appdetails*' => Http::response([]),
        ]);

        (new RefreshShelfPrices)->handle(app(SteamPriceService::class), app(GogService::class));

        $this->assertSame(1999, GamePrice::where('game_id', $game->id)->value('full_cents'));
        $this->assertDatabaseHas('game_external_ids', [
            'provider' => 'steam', 'external_id' => '49520', 'game_id' => $game->id,
        ]);
    }

    /**
     * The search is a search. "Cave Story+" will return something for almost any
     * word, and pricing one game as another is worse than admitting ignorance.
     */
    #[Test]
    public function a_near_miss_from_the_search_is_refused(): void
    {
        $user = User::factory()->create();
        $game = $this->game('encased', 'Encased');
        $this->shelve($user, $game);

        Http::fake([
            '*storesearch*' => Http::response(['items' => [
                ['id' => 99999, 'name' => 'Encased: Deluxe Bundle', 'price' => ['currency' => 'USD', 'initial' => 9999, 'final' => 9999]],
            ]]),
            '*appdetails*' => Http::response([]),
        ]);

        (new RefreshShelfPrices)->handle(app(SteamPriceService::class), app(GogService::class));

        $this->assertSame('unavailable', GamePrice::where('game_id', $game->id)->value('status'));
        $this->assertDatabaseMissing('game_external_ids', ['external_id' => '99999']);
    }

    /**
     * Punctuation and capitals are not a different game.
     */
    #[Test]
    public function a_title_that_differs_only_in_punctuation_still_matches(): void
    {
        $user = User::factory()->create();
        $game = $this->game('ds', "Death Stranding Director's Cut");
        $this->shelve($user, $game);
        GameExternalId::create(['provider' => 'igdb', 'external_id' => '1', 'game_id' => $game->id]);

        Http::fake([
            '*storesearch*' => Http::response(['items' => [
                ['id' => 1850570, 'name' => 'DEATH STRANDING DIRECTOR’S CUT', 'price' => ['currency' => 'USD', 'initial' => 3999, 'final' => 3999]],
            ]]),
            '*appdetails*' => Http::response([]),
        ]);

        (new RefreshShelfPrices)->handle(app(SteamPriceService::class), app(GogService::class));

        $this->assertSame(3999, GamePrice::where('game_id', $game->id)->value('full_cents'));
    }

    /**
     * Steam ranks a search the way a shop does, not the way a lookup does.
     *
     * "Inside" returns Inside the Backrooms, then Organized Inside, then the
     * game itself. Reading only the first row left INSIDE — and everything else
     * named after a common word — recorded as having no price at all.
     */
    #[Test]
    public function an_exact_title_further_down_the_results_is_still_found(): void
    {
        $user = User::factory()->create();
        $game = $this->game('inside', 'Inside');
        $this->shelve($user, $game);

        Http::fake([
            '*storesearch*' => Http::response(['items' => [
                ['id' => 1, 'name' => 'Inside the Backrooms', 'price' => ['currency' => 'USD', 'initial' => 699, 'final' => 699]],
                ['id' => 2, 'name' => 'Organized Inside', 'price' => ['currency' => 'USD', 'initial' => 799, 'final' => 799]],
                ['id' => 304430, 'name' => 'INSIDE', 'price' => ['currency' => 'USD', 'initial' => 2499, 'final' => 2499]],
            ]]),
            '*appdetails*' => Http::response([]),
        ]);

        (new RefreshShelfPrices)->handle(app(SteamPriceService::class), app(GogService::class));

        $this->assertSame(2499, GamePrice::where('game_id', $game->id)->value('full_cents'));
    }

    /**
     * Steam marks a remake with the year; our catalogue does not.
     */
    #[Test]
    public function a_year_in_brackets_is_not_a_different_game(): void
    {
        $user = User::factory()->create();
        $game = $this->game('lof2', 'Layers of Fear 2');
        $this->shelve($user, $game);

        Http::fake([
            '*storesearch*' => Http::response(['items' => [
                ['id' => 1, 'name' => 'Layers of Fear 2－Original Soundtrack', 'price' => ['currency' => 'USD', 'initial' => 999, 'final' => 999]],
                ['id' => 1029890, 'name' => 'Layers of Fear 2 (2019)', 'price' => ['currency' => 'USD', 'initial' => 1999, 'final' => 1999]],
            ]]),
            '*appdetails*' => Http::response([]),
        ]);

        (new RefreshShelfPrices)->handle(app(SteamPriceService::class), app(GogService::class));

        $this->assertSame(1999, GamePrice::where('game_id', $game->id)->value('full_cents'));
    }
}
