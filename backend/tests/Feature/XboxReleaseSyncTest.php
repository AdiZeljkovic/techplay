<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameStoreLink;
use App\Services\Releases\XboxSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class XboxReleaseSyncTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<int,string> product ids the sitemap lists */
    private array $catalogue = [];

    /** @var array<string,array> summaries keyed by product id */
    private array $summaries = [];

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'www.xbox.com/sitemap.xml' => fn () => Http::response(
                '<sitemapindex><sitemap><loc>https://www.xbox.com/sitemap/pdp-en-US-sitemap-0.xml.gz</loc></sitemap>'
                .'<sitemap><loc>https://www.xbox.com/sitemap/pdp-de-DE-sitemap-0.xml.gz</loc></sitemap></sitemapindex>'
            ),

            'www.xbox.com/sitemap/*' => function ($request) {
                // Only the market we read should ever be walked.
                if (! str_contains($request->url(), 'pdp-en-US')) {
                    return Http::response('<urlset></urlset>');
                }

                $urls = collect($this->catalogue)
                    ->map(fn (string $id) => "<url><loc>https://www.xbox.com/en-US/games/store/a-game/{$id}</loc></url>")
                    ->implode('');

                return Http::response("<urlset>{$urls}</urlset>");
            },

            'displaycatalog.mp.microsoft.com/*' => function ($request) {
                parse_str(parse_url($request->url(), PHP_URL_QUERY) ?: '', $query);
                $wanted = explode(',', $query['bigIds'] ?? '');

                $found = collect($wanted)
                    ->map(fn (string $id) => $this->summaries[$id] ?? null)
                    ->filter()
                    ->values()
                    ->all();

                return Http::response(['Products' => $found]);
            },
        ]);
    }

    /** A product in the shape Microsoft's display catalogue actually returns. */
    private function summary(string $id, array $attrs = []): array
    {
        $images = [['ImagePurpose' => 'SuperHeroArt', 'Uri' => '//store-images.example/hero.jpg']];

        foreach (range(1, $attrs['screenshots'] ?? 8) as $n) {
            $images[] = ['ImagePurpose' => 'Screenshot', 'Uri' => "//store-images.example/s{$n}.jpg"];
        }

        unset($attrs['screenshots']);

        return array_replace_recursive([
            'ProductId' => $id,
            'ProductKind' => 'Game',
            'LocalizedProperties' => [[
                'ProductTitle' => 'Octo Curse',
                'PublisherName' => 'Ocean Media',
                'DeveloperName' => 'Ajvar Studio',
                'ProductDescription' => str_repeat('A pirate turned into an octopus, and a curse to break. ', 5),
                'Images' => $images,
            ]],
            'MarketProperties' => [[
                'OriginalReleaseDate' => '2026-08-14T00:00:00.0000000Z',
                'ContentRatings' => [['RatingSystem' => 'ESRB', 'RatingId' => 'ESRB:E', 'RatingDescriptors' => ['ESRB:MilFanVio']]],
            ]],
            'Properties' => ['Categories' => ['Platformer'], 'XboxConsoleGenOptimized' => true],
            'DisplaySkuAvailabilities' => [[
                'Sku' => ['Properties' => ['Packages' => [[
                    'PlatformDependencies' => [['PlatformName' => 'Windows.Xbox']],
                ]]]],
            ]],
        ], $attrs);
    }

    private function listing(array $summaries): void
    {
        $this->summaries = collect($summaries)->keyBy('ProductId')->all();
        $this->catalogue = array_keys($this->summaries);
    }

    private function sync(string $from = '2026-08-01', string $to = '2026-10-31'): array
    {
        return app(XboxSync::class)->run(Carbon::parse($from), Carbon::parse($to));
    }

    public function test_a_console_game_lands_with_its_art_and_platforms(): void
    {
        $this->listing([$this->summary('9MV3MNP9K5VD')]);

        $this->assertSame(1, $this->sync()['created']);

        $game = Game::first();
        $this->assertSame('Octo Curse', $game->name);
        $this->assertSame('2026-08-14', $game->released->toDateString());
        $this->assertSame('https://store-images.example/hero.jpg', $game->background_image);
        $this->assertSame(['Xbox Series X|S'], $game->platform_names, 'read from the packages, not guessed');
        $this->assertSame(['Platformer'], $game->genre_names);
    }

    public function test_only_the_market_we_read_is_walked(): void
    {
        $this->listing([$this->summary('9MV3MNP9K5VD')]);
        $this->sync();

        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'pdp-de-DE'));
    }

    public function test_an_add_on_is_not_a_calendar_entry(): void
    {
        // Xbox calls DLC "Durable"; only "Game" belongs on a release calendar.
        $this->listing([$this->summary('9MV3MNP9K5VD', ['ProductKind' => 'Durable'])]);

        $this->assertSame(1, $this->sync()['rejected']);
        $this->assertSame('not a game (durable)', GameStoreLink::first()->rejected_reason);
    }

    public function test_adult_ratings_are_read_from_the_boards_own_wording(): void
    {
        // ESRB:SexCon is how the catalogue says "Sexual Content".
        $this->listing([$this->summary('9MV3MNP9K5VD', [
            'MarketProperties' => [['ContentRatings' => [[
                'RatingId' => 'ESRB:AO',
                'RatingDescriptors' => ['ESRB:SexCon', 'ESRB:Blood'],
            ]]]],
        ])]);

        $this->assertSame(1, $this->sync()['rejected']);
        $this->assertSame('adult content', GameStoreLink::first()->rejected_reason);
    }

    public function test_a_mature_rating_is_not_treated_as_adult_content(): void
    {
        // Most of the year's biggest games are rated Mature. It says nothing
        // about whether they belong on a release calendar.
        $this->listing([$this->summary('9MV3MNP9K5VD', [
            'MarketProperties' => [['ContentRatings' => [[
                'RatingId' => 'ESRB:M',
                'RatingDescriptors' => ['ESRB:BloodGore', 'ESRB:IntVio', 'ESRB:StrLang'],
            ]]]],
        ])]);

        $this->assertSame(1, $this->sync()['created']);
    }

    /* ── the part that makes Xbox affordable ──────────────────────────── */

    public function test_a_product_outside_the_window_is_asked_about_once_and_remembered(): void
    {
        $this->listing([$this->summary('9MV3MNP9K5VD', ['MarketProperties' => [['OriginalReleaseDate' => '2027-03-01T00:00:00.0000000Z']]])]);

        $tally = $this->sync();

        $this->assertSame(0, $tally['seen'], 'it is not in this window');
        $this->assertSame(0, Game::count());

        $link = GameStoreLink::first();
        $this->assertSame('outside the window', $link->rejected_reason);
        $this->assertSame('2027-03-01', $link->payload['released'], 'the date is kept so we never ask again');

        // A second pass over the same catalogue costs nothing.
        $before = $this->productCalls();
        $this->sync();

        $this->assertSame($before, $this->productCalls(), 'a known product is never re-fetched');
    }

    public function test_a_parked_product_is_picked_up_when_the_window_reaches_it(): void
    {
        $this->listing([$this->summary('9MV3MNP9K5VD', ['MarketProperties' => [['OriginalReleaseDate' => '2027-03-01T00:00:00.0000000Z']]])]);
        $this->sync();

        $this->assertSame(0, Game::count());

        // Six months later the window has moved onto it.
        $tally = $this->sync('2027-01-01', '2027-03-31');

        $this->assertSame(1, $tally['created']);
        $this->assertSame('2027-03-01', Game::first()->released->toDateString());
    }

    public function test_the_second_pass_only_asks_about_what_the_sitemap_gained(): void
    {
        $this->listing([$this->summary('9MV3MNP9K5VD')]);
        $this->sync();

        $before = $this->productCalls();

        // Xbox adds one product; the rest of the catalogue is unchanged.
        $this->listing([
            $this->summary('9MV3MNP9K5VD'),
            $this->summary('BT5P2X999VH2', ['LocalizedProperties' => [['ProductTitle' => 'Something New']]]),
        ]);

        $tally = $this->sync();

        $this->assertSame(1, $tally['created']);
        $this->assertSame($before + 1, $this->productCalls(), 'one batch, for the one new id');
    }

    public function test_an_undated_product_is_dropped_rather_than_guessed_at(): void
    {
        $this->listing([
            $this->summary('9MV3MNP9K5VD', ['MarketProperties' => [['OriginalReleaseDate' => null]]]),
            $this->summary('BT5P2X999VH2', ['LocalizedProperties' => [['ProductTitle' => 'The Real One']]]),
        ]);

        $this->assertSame(1, $this->sync()['seen']);
        $this->assertSame('The Real One', Game::first()->name);
    }

    private function productCalls(): int
    {
        return Http::recorded(fn ($r) => str_contains($r->url(), 'displaycatalog.mp.microsoft.com'))->count();
    }
}
