<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameStoreLink;
use App\Services\Releases\PlaystationSync;
use App\Services\Releases\TransientFailure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlaystationReleaseSyncTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string,array> product records keyed by store id */
    private array $products = [];

    /** What the store answers with, so a test can make it misbehave. */
    private int $status = 200;

    /** Stand in for Sony reassembling the page in a way we do not know. */
    private bool $unrecognisedPage = false;

    /** A page body written by hand, when a test needs an exact shape. */
    private ?string $rawPage = null;

    protected function setUp(): void
    {
        parent::setUp();

        config(['releases.delay_ms' => 0]);

        Http::fake([
            'store.playstation.com/en-us/category/*' => function ($request) {
                if ($this->status !== 200) {
                    return Http::response('', $this->status);
                }

                // Everything sits on page one; later pages repeat nothing.
                if (! str_ends_with($request->url(), '/1')) {
                    return Http::response('<html></html>');
                }

                $links = collect(array_keys($this->products))
                    ->map(fn (string $id) => "<a href=\"/en-us/product/{$id}\">x</a>")
                    ->implode('');

                return Http::response("<html>{$links}</html>");
            },

            'store.playstation.com/en-us/product/*' => function ($request) {
                if ($this->status !== 200) {
                    return Http::response('', $this->status);
                }

                if ($this->unrecognisedPage) {
                    return Http::response('<html><body>a redesign</body></html>');
                }

                if ($this->rawPage !== null) {
                    return Http::response($this->rawPage);
                }

                $id = basename(parse_url($request->url(), PHP_URL_PATH));

                if (! isset($this->products[$id])) {
                    return Http::response('', 404);
                }

                return Http::response($this->page($id, $this->products[$id]));
            },
        ]);
    }

    /** A product record in the shape Sony embeds in its own page. */
    private function product(array $attrs = []): array
    {
        return array_merge([
            'name' => 'Arcade Archives TX-1',
            'releaseDate' => '2026-09-04T04:00:00Z',
            'publisherName' => 'HAMSTER Corporation',
            'platforms' => ['PS5', 'PS4'],
            'topCategory' => 'GAME',
            'storeDisplayClassification' => 'FULL_GAME',
            'descriptions' => [
                ['type' => 'LEGAL', 'value' => '© Someone. All rights reserved.'],
                ['type' => 'GAME', 'value' => '<p>'.str_repeat('A real description of a real game. ', 8).'</p>'],
            ],
        ], $attrs);
    }

    /**
     * The page as Sony assembles it: __NEXT_DATA__, holding fragments, each
     * holding an island of the Apollo cache.
     */
    private function page(string $id, array $product): string
    {
        $media = collect(range(1, 6))
            ->mapWithKeys(fn (int $n) => ["Media:s{$n}" => ['role' => 'SCREENSHOT', 'url' => "https://image.api.playstation.com/s{$n}.jpg"]])
            ->put('Media:hero', ['role' => 'SIXTEEN_BY_NINE_BANNER', 'url' => 'https://image.api.playstation.com/hero.jpg'])
            ->all();

        $island = json_encode(['cache' => array_merge(['Product:'.$id => array_merge(['id' => $id], $product)], $media)]);

        $next = json_encode(['props' => ['pageProps' => ['batarangs' => [
            'game-title' => ['text' => '<div><script type="application/json">'.$island.'</script></div>'],
        ]]]]);

        return '<html><script id="__NEXT_DATA__" type="application/json">'.$next.'</script></html>';
    }

    private function listing(array $products): void
    {
        $this->products = $products;
    }

    private function sync(string $from = '2026-08-01', string $to = '2026-10-31'): array
    {
        return app(PlaystationSync::class)->run(Carbon::parse($from), Carbon::parse($to));
    }

    public function test_a_playstation_release_is_read_out_of_the_page_sony_rendered(): void
    {
        $this->listing(['UP0001-PPSA01234_00-ABCDEFGH' => $this->product()]);

        $this->assertSame(1, $this->sync()['created']);

        $game = Game::first();
        $this->assertSame('Arcade Archives TX-1', $game->name);
        $this->assertSame('2026-09-04', $game->released->toDateString());
        $this->assertSame('https://image.api.playstation.com/hero.jpg', $game->background_image);
        $this->assertSame(['PlayStation 5', 'PlayStation 4'], $game->platform_names);
        $this->assertCount(6, $game->screenshots_data);
        $this->assertSame('HAMSTER Corporation', $game->details_data['publisher']);
    }

    public function test_a_thin_fragment_does_not_erase_what_a_fuller_one_knew(): void
    {
        // Sony's page is assembled from fragments carrying overlapping slices
        // of the same records, and most are thin — the one that renders the buy
        // button knows a product's name and nothing else. Merging by
        // replacement silently dropped the release date and cost an afternoon.
        $id = 'UP1';
        $this->listing([$id => $this->product()]);

        $rich = json_encode(['cache' => [
            'Product:'.$id => array_merge(['id' => $id], $this->product()),
            'Concept:1' => ['personalizedMeta' => ['media' => [
                ['role' => 'SIXTEEN_BY_NINE_BANNER', 'url' => 'https://image.api.playstation.com/hero.jpg'],
                ['role' => 'SCREENSHOT', 'url' => 'https://image.api.playstation.com/s1.jpg'],
                ['role' => 'SCREENSHOT', 'url' => 'https://image.api.playstation.com/s2.jpg'],
                ['role' => 'SCREENSHOT', 'url' => 'https://image.api.playstation.com/s3.jpg'],
            ]]],
        ]]);

        // The buy-button fragment, which comes later and knows almost nothing.
        $thin = json_encode(['cache' => [
            'Product:'.$id => ['id' => $id, 'name' => 'Arcade Archives TX-1', 'webctas' => []],
        ]]);

        $next = json_encode(['props' => ['pageProps' => ['batarangs' => [
            'game-title' => ['text' => '<script type="application/json">'.$rich.'</script>'],
            'cta' => ['text' => '<script type="application/json">'.$thin.'</script>'],
        ]]]]);

        $this->rawPage = '<html><script id="__NEXT_DATA__" type="application/json">'.$next.'</script></html>';

        $this->assertSame(1, $this->sync()['created']);

        $game = Game::first();
        $this->assertSame('2026-09-04', $game->released->toDateString(), 'the later fragment must not erase the date');
        // Art hangs off the concept, nested, not beside the product.
        $this->assertSame('https://image.api.playstation.com/hero.jpg', $game->background_image);
        $this->assertCount(3, $game->screenshots_data);
    }

    public function test_the_legal_notice_is_not_the_description(): void
    {
        // Sony files copyright text alongside the copy that describes the game.
        $this->listing(['UP1' => $this->product()]);

        $this->sync();

        $description = Game::first()->details_data['description'];
        $this->assertStringContainsString('A real description', $description);
        $this->assertStringNotContainsString('All rights reserved', $description);
        $this->assertStringNotContainsString('<p>', $description, 'markup is stripped');
    }

    public function test_only_a_full_game_is_a_calendar_entry(): void
    {
        $this->listing(['UP1' => $this->product(['storeDisplayClassification' => 'ADD_ON'])]);

        $this->assertSame(1, $this->sync()['rejected']);
        $this->assertSame('not a game (add_on)', GameStoreLink::first()->rejected_reason);
    }

    public function test_a_product_outside_the_window_is_asked_about_once(): void
    {
        $this->listing(['UP1' => $this->product(['releaseDate' => '2027-06-01T00:00:00Z'])]);

        $this->assertSame(0, $this->sync()['seen']);

        $link = GameStoreLink::first();
        $this->assertSame('outside the window', $link->rejected_reason);
        $this->assertSame('2027-06-01', $link->payload['released']);

        $before = $this->productPages();
        $this->sync();
        $this->assertSame($before, $this->productPages(), 'a known product is never re-opened');
    }

    public function test_a_parked_product_arrives_when_the_window_reaches_it(): void
    {
        $this->listing(['UP1' => $this->product(['releaseDate' => '2027-06-01T00:00:00Z'])]);
        $this->sync();

        $this->assertSame(1, $this->sync('2027-04-01', '2027-06-30')['created']);
        $this->assertSame('2027-06-01', Game::first()->released->toDateString());
    }

    public function test_a_page_we_no_longer_recognise_is_skipped_not_guessed(): void
    {
        // If Sony changes how the page is assembled this is what happens: the
        // product is left out rather than invented.
        $this->listing(['UP1' => $this->product()]);
        $this->unrecognisedPage = true;

        $tally = $this->sync();

        $this->assertSame(0, $tally['seen']);
        $this->assertSame(0, Game::count());
    }

    public function test_the_store_falling_over_is_reported_not_swallowed(): void
    {
        $this->listing(['UP1' => $this->product()]);
        $this->status = 503;

        $this->expectException(TransientFailure::class);

        $this->sync();
    }

    private function productPages(): int
    {
        return Http::recorded(fn ($r) => str_contains($r->url(), '/en-us/product/'))->count();
    }
}
