<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameStoreLink;
use App\Services\Releases\NintendoSync;
use App\Services\Releases\TransientFailure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NintendoReleaseSyncTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<int,array> the eShop's answer for the next sync */
    private array $docs = [];

    private int $status = 200;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'searching.nintendo-europe.com/*' => function () {
                if ($this->status !== 200) {
                    return Http::response('', $this->status);
                }

                return Http::response(['response' => ['numFound' => count($this->docs), 'docs' => $this->docs]]);
            },
        ]);
    }

    /** A document in the shape Nintendo's Solr index actually returns. */
    private function doc(array $attrs = []): array
    {
        static $n = 0;
        $n++;

        return array_merge([
            'title' => 'Castaway',
            'nsuid_txt' => ['7001000012411'.$n],
            'fs_id' => 3138800 + $n,
            'dates_released_dts' => ['2026-08-01T00:00:00Z'],
            'image_url_h16x9_s' => 'https://nintendo.example/16x9.jpg',
            'image_url_sq_s' => 'https://nintendo.example/1x1.jpg',
            'publisher' => 'Nerd Games',
            'pretty_game_categories_txt' => ['Adventure', 'Simulation'],
            'excerpt' => 'Survive day and night on a small island in the middle of the ocean.',
            'product_catalog_description_s' => 'Survive day and night on a small island in the middle of the ocean.',
            'url' => '/en-gb/Games/Nintendo-Switch-download-software/Castaway-3138806.html',
            'system_names_txt' => ['Nintendo Switch'],
        ], $attrs);
    }

    private function sync(): array
    {
        return app(NintendoSync::class)->run(Carbon::parse('2026-08-01'), Carbon::parse('2026-10-31'));
    }

    public function test_the_whole_window_arrives_in_a_single_request(): void
    {
        $this->docs = [$this->doc(), $this->doc(['title' => 'Titanic Survival Simulator'])];

        $tally = $this->sync();

        $this->assertSame(2, $tally['created']);
        $this->assertCount(1, Http::recorded(), 'the listing is the whole story');
    }

    public function test_a_switch_game_lands_with_its_art_and_platform(): void
    {
        $this->docs = [$this->doc()];

        $this->sync();

        $game = Game::first();
        $this->assertSame('Castaway', $game->name);
        $this->assertSame('2026-08-01', $game->released->toDateString());
        $this->assertSame('day', $game->release_precision);
        $this->assertSame('https://nintendo.example/16x9.jpg', $game->background_image);
        $this->assertSame(['Adventure', 'Simulation'], $game->genre_names);
        $this->assertSame(['Nintendo Switch'], $game->platform_names);
        $this->assertSame('Nerd Games', $game->details_data['publisher']);

        $link = GameStoreLink::first();
        $this->assertSame('nintendo', $link->store);
        $this->assertStringStartsWith('https://www.nintendo.co.uk/', $link->url, 'relative paths are resolved');
    }

    public function test_nintendo_is_judged_by_its_own_thresholds(): void
    {
        // Steam's floor is 200 characters. Nintendo's own copy is a one-line
        // hook of about sixty, so Steam's number would erase the catalogue
        // rather than filter it.
        $this->docs = [$this->doc()];

        $this->assertSame(1, $this->sync()['created']);
        $this->assertLessThan(200, mb_strlen(Game::first()->details_data['description']));
    }

    public function test_a_listing_with_nothing_written_about_it_still_falls(): void
    {
        $this->docs = [$this->doc([
            'excerpt' => 'Fun game',
            'product_catalog_description_s' => 'Fun game',
        ])];

        $tally = $this->sync();

        $this->assertSame(1, $tally['rejected']);
        $this->assertSame('description too short', GameStoreLink::first()->rejected_reason);
    }

    public function test_a_document_without_an_identity_is_skipped_rather_than_guessed(): void
    {
        $this->docs = [
            $this->doc(['nsuid_txt' => [], 'fs_id' => null]),
            $this->doc(['title' => '']),
            $this->doc(['dates_released_dts' => []]),
            $this->doc(['title' => 'The Real One']),
        ];

        $tally = $this->sync();

        $this->assertSame(1, $tally['seen']);
        $this->assertSame('The Real One', Game::first()->name);
    }

    public function test_the_eshop_falling_over_is_reported_not_swallowed(): void
    {
        // A store being down must never look like a store with nothing to say.
        $this->status = 503;
        $this->docs = [$this->doc()];

        $this->expectException(TransientFailure::class);

        $this->sync();
    }

    public function test_a_rerelease_is_filed_under_the_date_we_asked_about(): void
    {
        // Real case: "Lou's Lagoon – Nintendo Switch 2 Edition" carries both
        // its original July date and the edition's. Solr matches the document
        // on either, so taking the first would put it in the wrong month —
        // outside the window entirely.
        $this->docs = [$this->doc([
            'title' => "Lou's Lagoon – Nintendo Switch™ 2 Edition",
            'dates_released_dts' => ['2026-07-16T00:00:00Z', '2026-09-04T00:00:00Z'],
        ])];

        $this->sync();

        $this->assertSame('2026-09-04', Game::first()->released->toDateString());
    }

    public function test_a_delay_is_picked_up_without_a_second_source(): void
    {
        $this->docs = [$this->doc()];
        $this->sync();

        $this->docs = [$this->doc(['dates_released_dts' => ['2026-09-15T00:00:00Z']])];

        // The doc helper increments its id, so pin it back to the same title.
        $this->docs[0]['nsuid_txt'] = [GameStoreLink::first()->store_id];

        $tally = $this->sync();

        $this->assertSame(1, $tally['updated']);
        $this->assertSame('2026-09-15', Game::first()->released->toDateString());
    }
}
