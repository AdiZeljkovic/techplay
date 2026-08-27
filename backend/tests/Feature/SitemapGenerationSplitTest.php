<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * The two halves of sitemap:generate must not erase each other.
 *
 * The catalogue files take about half an hour to build and the content files
 * take under a second, so they run on different schedules — content every
 * fifteen minutes, the full pass once at night. That split is only safe
 * because the prune is off on a partial run.
 *
 * Without that guard the two would take turns deleting each other: --content
 * writes eight files and would remove every games file as "no longer
 * generated", then the nightly pass would remove every article file. The site
 * would always be missing one half and the index would name files that are not
 * there.
 */
class SitemapGenerationSplitTest extends TestCase
{
    use RefreshDatabase;

    private string $decoy;

    protected function setUp(): void
    {
        parent::setUp();

        // Stands in for a catalogue file a --content run must leave alone.
        $this->decoy = public_path('sitemap-games-1.xml');
        File::put($this->decoy, '<?xml version="1.0"?><urlset/>');
    }

    protected function tearDown(): void
    {
        File::delete($this->decoy);

        parent::tearDown();
    }

    public function test_a_content_run_leaves_the_catalogue_files_alone(): void
    {
        $this->artisan('sitemap:generate --content')->assertSuccessful();

        $this->assertFileExists(
            $this->decoy,
            'a --content run deleted a games sitemap it simply did not write'
        );
    }

    public function test_a_content_run_still_writes_what_it_owns(): void
    {
        $this->artisan('sitemap:generate --content')->assertSuccessful();

        $this->assertFileExists(public_path('sitemap-articles.xml'));
        $this->assertFileExists(public_path('sitemap-news.xml'));
    }

    public function test_the_two_switches_are_not_both_allowed(): void
    {
        $this->artisan('sitemap:generate --content --catalogue')->assertFailed();
    }

    /**
     * With no products, the file must not be written at all.
     *
     * index() lists sitemap-products.xml only when a product is active, and
     * this command wrote it either way — so with an empty shop it produced a
     * sitemap holding nothing but /shop, a URL already in sitemap-pages.xml,
     * that the index never named. Served, unreferenced, maintained by nobody:
     * the same shape as sitemap-videos.xml, which outlived its section for
     * months for exactly this reason.
     */
    public function test_an_empty_shop_writes_no_products_sitemap(): void
    {
        $path = public_path('sitemap-products.xml');
        File::delete($path);

        $this->artisan('sitemap:generate --content')->assertSuccessful();

        $this->assertFileDoesNotExist(
            $path,
            'a sitemap the index will never name should not be written'
        );
    }
}
